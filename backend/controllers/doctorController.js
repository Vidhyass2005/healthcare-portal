const Appointment = require('../models/Appointment');
const LabBooking = require('../models/LabBooking');
const BloodRequest = require('../models/BloodRequest');
const User = require('../models/User');
const { reorderDoctorQueue } = require('../services/priorityEngine');
const { emitEmergencyBloodAlert } = require('../services/socketService');

// @desc Get Doctor Dashboard Metrics and Active Daily Queue
// @route GET /api/doctor/dashboard
exports.getDoctorDashboardSummary = async (req, res, next) => {
  try {
    const doctorId = req.user.id;
    const today = new Date().toISOString().split('T')[0];

    const todayAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: today
    })
    .populate('patient', 'allergies medicalAlerts latestVitals')
    .sort({
      isEmergency: -1,
      priorityScore: -1,
      createdAt: 1
    });

    // Incoming inter-department referrals for this doctor
    const referredQueue = await Appointment.find({
      doctor: doctorId,
      isReferralPatient: true,
      status: { $in: ['Confirmed', 'In Progress', 'Pending'] }
    })
    .populate('patient', 'allergies medicalAlerts latestVitals')
    .sort({ isEmergency: -1, priorityScore: -1, createdAt: -1 });

    const totalToday = todayAppointments.length;
    const completedCount = todayAppointments.filter(a => a.status === 'Completed').length;
    const inProgressAppt = todayAppointments.find(a => a.status === 'In Progress');
    const highPriorityCount = todayAppointments.filter(a => a.priorityLevel === 'High' || a.isEmergency).length;
    const pendingQueue = todayAppointments.filter(a => a.status === 'Confirmed' || a.status === 'Pending');

    // Get doctor profile
    const doctorUser = await User.findById(doctorId);

    res.status(200).json({
      success: true,
      metrics: {
        totalToday,
        completedCount,
        highPriorityCount,
        pendingCount: pendingQueue.length,
        incomingReferralsCount: referredQueue.length,
        currentInConsultation: inProgressAppt || null,
        availabilityStatus: doctorUser.doctorProfile?.availabilityStatus || 'Available'
      },
      todayQueue: todayAppointments,
      referredQueue
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Doctor Availability Status (Handles doctor leave + appointment rescheduling)
// @route PUT /api/doctor/availability
exports.updateAvailability = async (req, res, next) => {
  try {
    const { availabilityStatus, autoRescheduleDate, leaveReason } = req.body;
    const doctor = await User.findById(req.user.id);

    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (!doctor.doctorProfile) {
      doctor.doctorProfile = {};
    }

    doctor.doctorProfile.availabilityStatus = availabilityStatus;
    await doctor.save();

    let affectedCount = 0;
    const today = new Date().toISOString().split('T')[0];

    // If doctor goes 'On Leave', handle active appointments
    if (availabilityStatus === 'On Leave') {
      const Notification = require('../models/Notification');
      const { emitAppointmentUpdate, emitQueueUpdate } = require('../services/socketService');

      // Find all upcoming confirmed/in-progress appointments for this doctor on or after today
      const upcomingAppointments = await Appointment.find({
        doctor: doctor._id,
        appointmentDate: { $gte: today },
        status: { $in: ['Confirmed', 'In Progress', 'Pending'] }
      });

      affectedCount = upcomingAppointments.length;

      // Default reschedule date to next available working day if provided, or tomorrow
      let targetDate = autoRescheduleDate;
      if (!targetDate) {
        const d = new Date();
        d.setDate(d.getDate() + 1);
        targetDate = d.toISOString().split('T')[0];
      }

      for (const appt of upcomingAppointments) {
        // Tag clinical note regarding doctor leave
        appt.status = 'Confirmed';
        const originalDate = appt.appointmentDate;
        const originalSlot = appt.slotTime;
        appt.appointmentDate = targetDate;
        appt.clinicalNotes = `[Doctor Leave Reschedule]: Dr. ${doctor.name} is temporarily on leave (${leaveReason || 'Clinical Emergency/Leave'}). Rescheduled from ${originalDate} ${originalSlot} to ${targetDate} ${appt.slotTime}.`;
        await appt.save();

        // Create notification for patient
        await Notification.create({
          recipient: appt.patient,
          title: `Appointment Rescheduled: Dr. ${doctor.name} on Leave`,
          message: `Your appointment with Dr. ${doctor.name} originally for ${originalDate} has been rescheduled to ${targetDate} at ${appt.slotTime} due to doctor leave.`,
          type: 'appointment_update',
          priority: 'high',
          metadata: {
            appointmentId: appt._id.toString(),
            originalDate,
            newDate: targetDate
          }
        });

        emitAppointmentUpdate(appt.patient, appt);
      }

      // Reorder queues
      await reorderDoctorQueue(doctor._id, today);
      await reorderDoctorQueue(doctor._id, targetDate);
    }

    res.status(200).json({
      success: true,
      message: availabilityStatus === 'On Leave'
        ? `Doctor marked On Leave. ${affectedCount} appointment(s) rescheduled to next available day.`
        : `Doctor status updated to ${availabilityStatus}`,
      availabilityStatus,
      affectedAppointments: affectedCount
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get complete medical history of a patient (Appointments + Lab Reports)
// @route GET /api/doctor/patient-history/:patientId
exports.getPatientHistory = async (req, res, next) => {
  try {
    const { patientId } = req.params;

    const patient = await User.findById(patientId).select('-password');
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    const pastAppointments = await Appointment.find({ patient: patientId })
      .populate('doctor', 'name doctorProfile.department')
      .sort({ appointmentDate: -1 });

    const labReports = await LabBooking.find({ patient: patientId })
      .populate('labTest')
      .sort({ bookingDate: -1 });

    res.status(200).json({
      success: true,
      patient,
      pastAppointments,
      labReports
    });
  } catch (error) {
    next(error);
  }
};

// @desc Doctor triggers Emergency Blood Request from consultation room
// @route POST /api/doctor/emergency-blood-request
exports.requestEmergencyBlood = async (req, res, next) => {
  try {
    const { patientName, bloodGroup, unitsRequired, reason, hospitalName } = req.body;

    const bloodRequest = await BloodRequest.create({
      requester: req.user.id,
      requesterName: req.user.name,
      requesterRole: 'doctor',
      patientName: patientName || 'OPD Emergency Patient',
      bloodGroup,
      unitsRequired: unitsRequired || 2,
      hospitalName: hospitalName || 'MEDCARE HOSPITAL (OPD Emergency)',
      urgencyLevel: 'Critical / Immediate',
      reason: reason || 'Acute clinical hemorrhage / urgent stabilization',
      isEmergencyAlertSent: true,
      status: 'Broadcasted'
    });

    emitEmergencyBloodAlert(bloodRequest);

    res.status(201).json({
      success: true,
      message: `Critical blood broadcast dispatched for ${unitsRequired} units of ${bloodGroup}!`,
      bloodRequest
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create Cross-Department Internal Referral
// @route POST /api/doctor/referral
exports.createCrossDepartmentReferral = async (req, res, next) => {
  try {
    const {
      appointmentId,
      referredToDepartment,
      referredToDoctorId,
      referralReason,
      referralUrgency
    } = req.body;

    const sourceAppt = await Appointment.findById(appointmentId);
    if (!sourceAppt) {
      return res.status(404).json({ success: false, message: 'Source appointment not found' });
    }

    const targetDoctor = await User.findById(referredToDoctorId);
    if (!targetDoctor || targetDoctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Target specialist doctor not found' });
    }

    const referringDoctor = await User.findById(req.user.id);
    const referringDoctorName = referringDoctor?.name || req.user.name;
    const referringDepartment = referringDoctor?.doctorProfile?.department || sourceAppt.department;

    // Update source appointment with referral info
    sourceAppt.referral = {
      isReferred: true,
      referredToDepartment: referredToDepartment || targetDoctor.doctorProfile?.department,
      referredToDoctor: targetDoctor._id,
      referredToDoctorName: targetDoctor.name,
      referralReason: referralReason || 'Specialist clinical assessment required',
      referralUrgency: referralUrgency || 'Routine',
      referralDate: new Date(),
      referralStatus: 'Pending Evaluation'
    };
    await sourceAppt.save();

    // Create incoming referral appointment for target doctor
    const today = new Date().toISOString().split('T')[0];
    const referralAppt = await Appointment.create({
      patient: sourceAppt.patient,
      patientName: sourceAppt.patientName,
      patientAge: sourceAppt.patientAge,
      patientGender: sourceAppt.patientGender,
      patientPhone: sourceAppt.patientPhone,
      doctor: targetDoctor._id,
      doctorName: targetDoctor.name,
      department: referredToDepartment || targetDoctor.doctorProfile?.department,
      appointmentDate: today,
      slotTime: referralUrgency === 'Immediate STAT' ? 'IMMEDIATE' : 'OPD Referral',
      symptoms: `[Cross-Dept Referral from ${referringDoctorName} (${referringDepartment})]: ${referralReason || sourceAppt.symptoms}`,
      severity: referralUrgency === 'Immediate STAT' ? 'Severe' : referralUrgency === 'Urgent' ? 'Moderate' : 'Mild',
      isEmergency: referralUrgency === 'Immediate STAT',
      priorityScore: referralUrgency === 'Immediate STAT' ? 95 : referralUrgency === 'Urgent' ? 70 : 40,
      priorityLevel: referralUrgency === 'Immediate STAT' ? 'High' : referralUrgency === 'Urgent' ? 'Moderate' : 'Low',
      status: 'Confirmed',
      vitals: sourceAppt.vitals || {},
      allergies: sourceAppt.allergies || [],
      medicalAlerts: sourceAppt.medicalAlerts || [],
      // Referral metadata
      isReferralPatient: true,
      referredByDoctorName: referringDoctorName,
      referredByDepartment: referringDepartment,
      referralReason: referralReason || 'Clinical referral'
    });

    // Notify target doctor & patient
    const Notification = require('../models/Notification');
    const { emitAppointmentUpdate } = require('../services/socketService');

    await Notification.create({
      recipient: targetDoctor._id,
      recipientRole: 'doctor',
      type: 'REFERRAL',
      title: `Inter-Department Referral: ${sourceAppt.patientName} (${referralUrgency || 'Routine'})`,
      message: `${referringDoctorName} (${referringDepartment}) has referred patient ${sourceAppt.patientName} to your clinic. Reason: ${referralReason}`,
      appointmentId: referralAppt._id
    });

    await Notification.create({
      recipient: sourceAppt.patient,
      recipientRole: 'patient',
      type: 'REFERRAL',
      title: `Cross-Department Referral to Dr. ${targetDoctor.name}`,
      message: `You have been referred to ${targetDoctor.name} (${referredToDepartment}) by ${referringDoctorName}. Evaluation queue initialized.`,
      appointmentId: referralAppt._id
    });

    emitAppointmentUpdate(targetDoctor._id, referralAppt);
    emitAppointmentUpdate(sourceAppt.patient, referralAppt);

    res.status(201).json({
      success: true,
      message: `Patient successfully referred to Dr. ${targetDoctor.name} (${referredToDepartment}) with ${referralUrgency} priority.`,
      referralAppt
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Patient Allergies, Medical Alerts, and Critical Flags
// @route PUT /api/doctor/patient-alerts/:patientId
exports.updatePatientAlerts = async (req, res, next) => {
  try {
    const { patientId } = req.params;
    const { allergies, medicalAlerts, appointmentId } = req.body;

    const patient = await User.findById(patientId);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }

    if (allergies !== undefined) {
      patient.allergies = Array.isArray(allergies) ? allergies : allergies.split(',').map(s => s.trim()).filter(Boolean);
    }
    if (medicalAlerts !== undefined) {
      patient.medicalAlerts = Array.isArray(medicalAlerts) ? medicalAlerts : medicalAlerts.split(',').map(s => s.trim()).filter(Boolean);
    }
    await patient.save();

    // If active appointmentId is provided, also sync to the appointment
    if (appointmentId) {
      await Appointment.findByIdAndUpdate(appointmentId, {
        allergies: patient.allergies,
        medicalAlerts: patient.medicalAlerts
      });
    }

    res.status(200).json({
      success: true,
      message: 'Patient clinical alerts and drug allergies updated successfully.',
      allergies: patient.allergies,
      medicalAlerts: patient.medicalAlerts
    });
  } catch (error) {
    next(error);
  }
};
