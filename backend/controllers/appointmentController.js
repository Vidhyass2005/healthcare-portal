const Appointment = require('../models/Appointment');
const User = require('../models/User');
const Notification = require('../models/Notification');
const { calculatePriorityScore, reorderDoctorQueue } = require('../services/priorityEngine');
const { calculateNoShowRisk } = require('../services/noShowPredictor');
const { emitQueueUpdate, emitAppointmentUpdate, emitNotification } = require('../services/socketService');

// Time helpers to prevent past booking and enforce only future timings
const getLocalDateString = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSlotInPast = (dateStr, slotTimeStr) => {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const match = (slotTimeStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let [_, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  const slotDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
  return slotDate <= now;
};

// Auto-expire unattended past or elapsed today's appointments
const autoExpireUnattendedAppointments = async (queryFilter = {}) => {
  try {
    const todayStr = getLocalDateString();

    // 1. Mark past-date unattended Confirmed or Pending appointments as Expired
    await Appointment.updateMany(
      {
        ...queryFilter,
        appointmentDate: { $lt: todayStr },
        status: { $in: ['Pending', 'Confirmed'] }
      },
      {
        $set: {
          status: 'Expired',
          attendanceStatus: 'Failed to Attend'
        }
      }
    );

    // 2. Mark today's elapsed slot appointments as Expired if patient has not attended
    const todayAppointments = await Appointment.find({
      ...queryFilter,
      appointmentDate: todayStr,
      status: { $in: ['Pending', 'Confirmed'] }
    });

    for (const appt of todayAppointments) {
      if (isSlotInPast(todayStr, appt.slotTime)) {
        appt.status = 'Expired';
        appt.attendanceStatus = 'Failed to Attend';
        await appt.save();
      }
    }
  } catch (err) {
    console.error('Error auto-expiring unattended appointments:', err.message);
  }
};
exports.autoExpireUnattendedAppointments = autoExpireUnattendedAppointments;

// @desc Book an outpatient appointment with priority scoring
// @route POST /api/appointments
exports.bookAppointment = async (req, res, next) => {
  try {
    const {
      doctorId,
      appointmentDate,
      slotTime,
      symptoms,
      severity,
      hasChronicCondition,
      chronicDiseases,
      isEmergency,
      patientAge,
      patientName,
      patientGender,
      patientPhone,
      specialAssistance
    } = req.body;

    const patientId = req.user.id;

    // Reject past date or past time slot bookings
    const todayStr = getLocalDateString();
    if (appointmentDate < todayStr || isSlotInPast(appointmentDate, slotTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book appointments for past dates or past time slots. Only future timings are available.'
      });
    }

    // Verify Doctor exists
    const doctor = await User.findOne({ _id: doctorId, role: 'doctor' });
    if (!doctor) {
      return res.status(404).json({ success: false, message: 'Selected doctor not found' });
    }

    if (doctor.doctorProfile?.availabilityStatus === 'On Leave') {
      return res.status(400).json({
        success: false,
        message: `Dr. ${doctor.name} is currently On Leave and not accepting appointments. Please choose another doctor or check back later.`
      });
    }

    // Check if slot falls on doctor's scheduled break
    const doctorBreaks = doctor.doctorProfile?.breakTimes || [];
    if (doctorBreaks.includes(slotTime)) {
      return res.status(400).json({
        success: false,
        message: `Dr. ${doctor.name} is on scheduled break (${doctor.doctorProfile?.breakReason || 'Lunch & Inpatient Ward Rounds'}) at ${slotTime}. Please select another time.`
      });
    }

    // Double-Booking Check: Check if slot is already occupied
    const existingBooking = await Appointment.findOne({
      doctor: doctorId,
      appointmentDate,
      slotTime,
      status: { $in: ['Confirmed', 'In Progress', 'Pending'] }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        message: `The slot ${slotTime} on ${appointmentDate} is already booked. Please choose another time slot.`
      });
    }

    const effectiveAge = patientAge || req.user.age || 30;
    const effectiveSeverity = severity || 'Mild';
    const effectiveChronic = hasChronicCondition !== undefined ? hasChronicCondition : req.user.hasChronicCondition;
    const effectiveEmergency = Boolean(isEmergency);

    // 1. Calculate Clinical Priority Score
    const { priorityScore, priorityLevel } = calculatePriorityScore({
      severity: effectiveSeverity,
      age: effectiveAge,
      hasChronicCondition: effectiveChronic,
      isEmergency: effectiveEmergency
    });

    // 2. Predict No-Show Risk Score
    const pastAppointments = await Appointment.find({ patient: patientId });
    const pastNoShows = pastAppointments.filter(a => a.status === 'No-Show' || a.status === 'Cancelled' || a.status === 'Expired').length;
    const noShowRiskScore = calculateNoShowRisk({
      pastNoShows,
      totalPastBookings: pastAppointments.length,
      severity: effectiveSeverity,
      daysInAdvance: 2
    });

    // Process Special Assistance Request (Bed / Wheelchair)
    const isWheelchair = Boolean(specialAssistance?.wheelchairRequired);
    const isObsBed = Boolean(specialAssistance?.observationBedRequired);
    const cleanAssistance = {
      wheelchairRequired: isWheelchair,
      observationBedRequired: isObsBed,
      notes: specialAssistance?.notes || '',
      status: (isWheelchair || isObsBed) ? 'Requested' : 'Not Required',
      assignedBedNumber: '',
      assignedStaffName: '',
      updatedAt: (isWheelchair || isObsBed) ? new Date() : null
    };

    // 3. Create Appointment
    const appointment = await Appointment.create({
      patient: patientId,
      patientName: patientName || req.user.name,
      patientAge: effectiveAge,
      patientGender: patientGender || req.user.gender || 'Male',
      patientPhone: patientPhone || req.user.phone || '',
      doctor: doctorId,
      doctorName: doctor.name,
      department: doctor.doctorProfile?.department || 'General Medicine',
      appointmentDate,
      slotTime,
      symptoms: symptoms || '',
      severity: effectiveSeverity,
      hasChronicCondition: effectiveChronic,
      chronicDiseases: chronicDiseases || req.user.chronicDiseases || [],
      isEmergency: effectiveEmergency,
      priorityScore,
      priorityLevel,
      noShowRiskScore,
      status: 'Confirmed',
      specialAssistance: cleanAssistance
    });

    // 4. Re-order doctor queue dynamically based on priority score
    const updatedQueue = await reorderDoctorQueue(doctorId, appointmentDate);
    const myUpdatedAppt = updatedQueue.find(a => a._id.toString() === appointment._id.toString()) || appointment;

    // 5. Emit real-time Socket.io update
    emitQueueUpdate(doctorId, {
      doctorId,
      date: appointmentDate,
      queue: updatedQueue
    });

    // 6. Role-Specific In-App Notifications
    // 6a. Patient Confirmation Notification
    const patientNotif = await Notification.create({
      recipient: patientId,
      recipientRole: 'patient',
      title: 'Appointment Confirmed',
      message: `Your appointment with Dr. ${doctor.name} on ${appointmentDate} at ${slotTime} is confirmed. Priority: ${priorityLevel}.`,
      type: 'appointment_update',
      priority: priorityLevel === 'High' ? 'high' : 'medium',
      metadata: { appointmentId: appointment._id.toString() }
    });
    emitNotification(patientId, 'patient', patientNotif);

    // 6b. Doctor Schedule Notification
    const doctorNotif = await Notification.create({
      recipient: doctorId,
      recipientRole: 'doctor',
      title: 'New Patient Appointment',
      message: `New consultation booked for ${appointment.patientName} on ${appointmentDate} at ${slotTime}. Priority: ${priorityLevel}.`,
      type: 'queue_alert',
      priority: priorityLevel === 'High' ? 'high' : 'medium',
      metadata: { appointmentId: appointment._id.toString() }
    });
    emitNotification(doctorId, 'doctor', doctorNotif);

    // 6c. Admin Assistance Notification (if Wheelchair or Observation Bed requested)
    if (isWheelchair || isObsBed) {
      const assistanceDetails = [isWheelchair ? 'Wheelchair' : null, isObsBed ? 'Observation Bed' : null].filter(Boolean).join(' & ');
      const adminAssistanceNotif = await Notification.create({
        recipientRole: 'admin',
        title: 'Assistance Requested (OPD Bed/Wheelchair)',
        message: `Patient ${appointment.patientName} requested ${assistanceDetails} for Dr. ${doctor.name} on ${appointmentDate} (${slotTime}).`,
        type: 'facility_assistance',
        priority: 'medium',
        metadata: { appointmentId: appointment._id.toString() }
      });
      emitNotification(null, 'admin', adminAssistanceNotif);
    }

    // 6d. Emergency Alert for Doctor & Admin if marked as emergency
    if (effectiveEmergency) {
      const emergencyNotif = await Notification.create({
        recipientRole: 'admin',
        title: 'CRITICAL EMERGENCY CHECK-IN',
        message: `Urgent emergency visit registered for ${appointment.patientName} with Dr. ${doctor.name} (${appointment.department}). Immediate attention required.`,
        type: 'emergency_alert',
        priority: 'high',
        metadata: { appointmentId: appointment._id.toString() }
      });
      emitNotification(null, 'admin', emergencyNotif);
      emitNotification(doctorId, 'doctor', emergencyNotif);
    }

    res.status(201).json({
      success: true,
      message: 'Appointment booked successfully',
      appointment: myUpdatedAppt
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get appointments for current user / doctor / admin
// @route GET /api/appointments
exports.getMyAppointments = async (req, res, next) => {
  try {
    // Automatically transition past unattended appointments to Expired
    await autoExpireUnattendedAppointments();

    let query = {};
    const { status, date, doctorId } = req.query;

    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    } else if (req.user.role === 'doctor') {
      query.doctor = req.user.id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (date) {
      query.appointmentDate = date;
    }

    if (doctorId && req.user.role === 'admin') {
      query.doctor = doctorId;
    }

    // Sort: High priority first for daily queue
    const appointments = await Appointment.find(query).sort({
      appointmentDate: -1,
      isEmergency: -1,
      priorityScore: -1,
      createdAt: 1
    });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get available doctor slots for a given date
// @route GET /api/appointments/slots/:doctorId
exports.getDoctorSlots = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ success: false, message: 'Please provide a date query parameter (YYYY-MM-DD)' });
    }

    // Automatically expire any elapsed bookings for this doctor before checking slots
    await autoExpireUnattendedAppointments({ doctor: doctorId });

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    const todayStr = getLocalDateString();
    if (date < todayStr) {
      return res.status(200).json({
        success: true,
        doctorId,
        doctorName: doctor.name,
        date,
        isPastDate: true,
        message: 'Cannot view or book slots for past dates. Please choose today or a future date.',
        slots: []
      });
    }

    const isOnLeave = doctor.doctorProfile?.availabilityStatus === 'On Leave';
    if (isOnLeave) {
      return res.status(200).json({
        success: true,
        doctorId,
        doctorName: doctor.name,
        date,
        isOnLeave: true,
        message: `Dr. ${doctor.name} is currently On Leave for this period. Appointments are temporarily paused.`,
        slots: []
      });
    }

    const allSlots = doctor.doctorProfile?.slotTimes || [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
      '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM',
      '03:00 PM', '03:30 PM', '04:00 PM'
    ];
    const breakTimes = doctor.doctorProfile?.breakTimes || [];
    const breakReason = doctor.doctorProfile?.breakReason || 'Lunch & Inpatient Ward Rounds';

    // Filter out past timing so ONLY future timing is visible to users
    const futureSlots = allSlots.filter(time => !isSlotInPast(date, time));

    // Find booked slots for this doctor on this date
    const bookedAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: date,
      status: { $in: ['Confirmed', 'In Progress', 'Pending'] }
    }).select('slotTime priorityLevel');

    const bookedSlotTimes = bookedAppointments.map(b => b.slotTime);

    const slotAvailability = futureSlots.map(time => {
      const isBooked = bookedSlotTimes.includes(time);
      const isBreak = breakTimes.includes(time);
      const bookedInfo = isBooked ? bookedAppointments.find(b => b.slotTime === time) : null;
      return {
        slotTime: time,
        isAvailable: !isBooked && !isBreak,
        isBreak,
        breakReason: isBreak ? breakReason : null,
        bookedPriority: bookedInfo ? bookedInfo.priorityLevel : null
      };
    });

    res.status(200).json({
      success: true,
      doctorId,
      doctorName: doctor.name,
      date,
      breakTimes,
      breakReason,
      slotDurationMinutes: doctor.doctorProfile?.slotDurationMinutes || 30,
      slots: slotAvailability
    });
  } catch (error) {
    next(error);
  }
};

// @desc Reschedule appointment
// @route PUT /api/appointments/:id/reschedule
exports.rescheduleAppointment = async (req, res, next) => {
  try {
    const { newDate, newSlotTime } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Verify ownership or doctor/admin privilege
    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to reschedule this appointment' });
    }

    // Validate future date and time
    const todayStr = getLocalDateString();
    if (newDate < todayStr || isSlotInPast(newDate, newSlotTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot reschedule an appointment to a past date or past time slot. Only future timings are available.'
      });
    }

    // Check slot availability
    const conflict = await Appointment.findOne({
      doctor: appointment.doctor,
      appointmentDate: newDate,
      slotTime: newSlotTime,
      _id: { $ne: appointment._id },
      status: { $in: ['Confirmed', 'In Progress', 'Pending'] }
    });

    if (conflict) {
      return res.status(400).json({ success: false, message: 'The requested slot is already booked. Please choose another.' });
    }

    const oldDate = appointment.appointmentDate;
    appointment.appointmentDate = newDate;
    appointment.slotTime = newSlotTime;
    appointment.status = 'Confirmed';
    await appointment.save();

    // Reorder both old and new dates' queues
    await reorderDoctorQueue(appointment.doctor, oldDate);
    const updatedQueue = await reorderDoctorQueue(appointment.doctor, newDate);

    emitAppointmentUpdate(appointment.patient, appointment);
    emitQueueUpdate(appointment.doctor, { doctorId: appointment.doctor, date: newDate, queue: updatedQueue });

    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled successfully',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc Cancel appointment
// @route PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res, next) => {
  try {
    const { cancellationReason } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not authorized to cancel this appointment' });
    }

    if (appointment.status === 'Cancelled') {
      return res.status(400).json({ success: false, message: 'This appointment is already cancelled.' });
    }

    if (appointment.status === 'Completed') {
      return res.status(400).json({ success: false, message: 'Cannot cancel an appointment that has already been completed.' });
    }

    const previousStatus = appointment.status;
    const reasonText = cancellationReason || (req.user.role === 'patient' ? 'Cancelled by patient' : 'Cancelled by clinic administration');
    
    appointment.status = 'Cancelled';
    appointment.clinicalNotes = appointment.clinicalNotes
      ? `${appointment.clinicalNotes} | [Cancellation]: ${reasonText}`
      : `[Cancellation]: ${reasonText}`;
    await appointment.save();

    // Reorder doctor queue after removal
    const updatedQueue = await reorderDoctorQueue(appointment.doctor, appointment.appointmentDate);

    // Notify user & doctor
    const patientNotif = await Notification.create({
      recipient: appointment.patient,
      recipientRole: 'patient',
      title: 'Appointment Cancelled',
      message: `Your appointment with Dr. ${appointment.doctorName} on ${appointment.appointmentDate} at ${appointment.slotTime} has been cancelled. Reason: ${reasonText}`,
      type: 'appointment_update',
      priority: 'medium',
      metadata: { appointmentId: appointment._id.toString() }
    });
    emitNotification(appointment.patient, 'patient', patientNotif);

    const docNotif = await Notification.create({
      recipient: appointment.doctor,
      recipientRole: 'doctor',
      title: 'Appointment Cancelled',
      message: `Appointment for ${appointment.patientName} on ${appointment.appointmentDate} at ${appointment.slotTime} has been cancelled (${reasonText}). Slot is now released.`,
      type: 'appointment_update',
      priority: 'medium',
      metadata: { appointmentId: appointment._id.toString() }
    });
    emitNotification(appointment.doctor, 'doctor', docNotif);

    emitAppointmentUpdate(appointment.patient, appointment);
    emitQueueUpdate(appointment.doctor, { doctorId: appointment.doctor, date: appointment.appointmentDate, queue: updatedQueue });

    res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully. Slot released.',
      appointment,
      cancellationReason: reasonText
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update consultation status (Doctor/Admin)
// @route PUT /api/appointments/:id/status
exports.updateAppointmentStatus = async (req, res, next) => {
  try {
    const {
      status,
      clinicalNotes,
      prescriptions,
      recommendedLabTests,
      vitals,
      allergies,
      medicalAlerts
    } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (status) {
      appointment.status = status;
      if (status === 'Expired' || status === 'No-Show') {
        appointment.attendanceStatus = 'Failed to Attend';
      } else if (status === 'Completed') {
        appointment.attendanceStatus = 'Attended';
      }
    }
    if (clinicalNotes !== undefined) appointment.clinicalNotes = clinicalNotes;
    if (prescriptions) appointment.prescriptions = prescriptions;
    if (recommendedLabTests) appointment.recommendedLabTests = recommendedLabTests;

    // Vitals processing & BMI calculation
    if (vitals) {
      let bmi = vitals.bmi || null;
      let bmiCategory = vitals.bmiCategory || 'Normal';

      if (vitals.heightCm && vitals.weightKg) {
        const heightM = Number(vitals.heightCm) / 100;
        const weight = Number(vitals.weightKg);
        if (heightM > 0 && weight > 0) {
          bmi = Number((weight / (heightM * heightM)).toFixed(1));
          if (bmi < 18.5) bmiCategory = 'Underweight (<18.5)';
          else if (bmi <= 24.9) bmiCategory = 'Normal (18.5-24.9)';
          else if (bmi <= 29.9) bmiCategory = 'Overweight (25.0-29.9)';
          else bmiCategory = 'Obese (≥30.0)';
        }
      }

      appointment.vitals = {
        bloodPressureSystolic: vitals.bloodPressureSystolic ? Number(vitals.bloodPressureSystolic) : null,
        bloodPressureDiastolic: vitals.bloodPressureDiastolic ? Number(vitals.bloodPressureDiastolic) : null,
        pulseHeartRate: vitals.pulseHeartRate ? Number(vitals.pulseHeartRate) : null,
        oxygenSaturation: vitals.oxygenSaturation ? Number(vitals.oxygenSaturation) : null,
        temperature: vitals.temperature ? Number(vitals.temperature) : null,
        heightCm: vitals.heightCm ? Number(vitals.heightCm) : null,
        weightKg: vitals.weightKg ? Number(vitals.weightKg) : null,
        bmi,
        bmiCategory,
        bloodSugarMgDl: vitals.bloodSugarMgDl ? Number(vitals.bloodSugarMgDl) : null
      };

      // Sync latest vitals to Patient User model
      const User = require('../models/User');
      await User.findByIdAndUpdate(appointment.patient, {
        latestVitals: {
          ...appointment.vitals,
          recordedAt: new Date()
        }
      });
    }

    // Allergies & Medical alerts processing
    if (allergies !== undefined) {
      const cleanAllergies = Array.isArray(allergies) ? allergies : allergies.split(',').map(s => s.trim()).filter(Boolean);
      appointment.allergies = cleanAllergies;
      const User = require('../models/User');
      await User.findByIdAndUpdate(appointment.patient, { allergies: cleanAllergies });
    }

    if (medicalAlerts !== undefined) {
      const cleanAlerts = Array.isArray(medicalAlerts) ? medicalAlerts : medicalAlerts.split(',').map(s => s.trim()).filter(Boolean);
      appointment.medicalAlerts = cleanAlerts;
      const User = require('../models/User');
      await User.findByIdAndUpdate(appointment.patient, { medicalAlerts: cleanAlerts });
    }

    // Follow-up visit scheduling
    const { followUp } = req.body;
    if (followUp && followUp.isFollowUpRequired && followUp.followUpDate) {
      const followUpDate = followUp.followUpDate;
      const followUpSlot = followUp.followUpSlot || '10:00 AM';
      const followUpInstructions = followUp.followUpInstructions || 'Clinical follow-up consultation';

      // Check if a follow-up appointment already exists or create new one
      let followUpAppt = null;
      try {
        followUpAppt = await Appointment.create({
          patient: appointment.patient,
          patientName: appointment.patientName,
          patientAge: appointment.patientAge,
          patientGender: appointment.patientGender,
          patientPhone: appointment.patientPhone,
          doctor: appointment.doctor,
          doctorName: appointment.doctorName,
          department: appointment.department,
          appointmentDate: followUpDate,
          slotTime: followUpSlot,
          symptoms: `[Follow-up Review]: ${followUpInstructions}`,
          severity: 'Mild',
          priorityScore: 50,
          priorityLevel: 'Moderate',
          hasChronicCondition: appointment.hasChronicCondition,
          chronicDiseases: appointment.chronicDiseases,
          status: 'Confirmed',
          allergies: appointment.allergies || [],
          medicalAlerts: appointment.medicalAlerts || [],
          vitals: appointment.vitals || {}
        });

        appointment.followUp = {
          isFollowUpRequired: true,
          followUpDate,
          followUpSlot,
          followUpInstructions,
          followUpStatus: 'Scheduled',
          followUpAppointmentId: followUpAppt._id
        };

        // Reorder queue for the follow-up date
        await reorderDoctorQueue(appointment.doctor, followUpDate);

        // Notify patient
        await Notification.create({
          recipient: appointment.patient,
          title: `Follow-Up Scheduled with Dr. ${appointment.doctorName}`,
          message: `Dr. ${appointment.doctorName} has scheduled your clinical follow-up visit on ${followUpDate} at ${followUpSlot}. Instructions: ${followUpInstructions}`,
          type: 'appointment_update',
          priority: 'medium',
          metadata: { appointmentId: followUpAppt._id.toString() }
        });

        emitAppointmentUpdate(appointment.patient, followUpAppt);
      } catch (err) {
        console.warn('Could not auto-book follow-up appointment:', err.message);
        appointment.followUp = {
          isFollowUpRequired: true,
          followUpDate,
          followUpSlot,
          followUpInstructions,
          followUpStatus: 'Scheduled',
          followUpAppointmentId: null
        };
      }
    }

    await appointment.save();

    // Role-specific notifications based on status transition
    if (status === 'In Progress') {
      const callNotif = await Notification.create({
        recipient: appointment.patient,
        recipientRole: 'patient',
        title: 'Doctor Calling - Consultation Started',
        message: `Dr. ${appointment.doctorName} is ready to see you now. Please proceed to the OPD consultation room.`,
        type: 'queue_alert',
        priority: 'high',
        metadata: { appointmentId: appointment._id.toString() }
      });
      emitNotification(appointment.patient, 'patient', callNotif);
    } else if (status === 'Completed') {
      const compNotif = await Notification.create({
        recipient: appointment.patient,
        recipientRole: 'patient',
        title: 'Consultation Completed & Prescription Ready',
        message: `Your consultation with Dr. ${appointment.doctorName} is complete. Your digital prescription and clinical records are now ready in your portal.`,
        type: 'prescription_ready',
        priority: 'medium',
        metadata: { appointmentId: appointment._id.toString() }
      });
      emitNotification(appointment.patient, 'patient', compNotif);
    } else if (status === 'Expired' || status === 'No-Show') {
      const expNotif = await Notification.create({
        recipient: appointment.patient,
        recipientRole: 'patient',
        title: 'Appointment Expired / Missed',
        message: `Your scheduled consultation with Dr. ${appointment.doctorName} on ${appointment.appointmentDate} was marked as missed. Please book a new slot if you still require medical consultation.`,
        type: 'appointment_update',
        priority: 'medium',
        metadata: { appointmentId: appointment._id.toString() }
      });
      emitNotification(appointment.patient, 'patient', expNotif);
    }

    // Reorder remaining active queue
    const updatedQueue = await reorderDoctorQueue(appointment.doctor, appointment.appointmentDate);

    emitAppointmentUpdate(appointment.patient, appointment);
    emitQueueUpdate(appointment.doctor, { doctorId: appointment.doctor, date: appointment.appointmentDate, queue: updatedQueue });

    res.status(200).json({
      success: true,
      message: `Appointment status updated to ${status}`,
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get single appointment by ID
// @route GET /api/appointments/:id
exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('patient', 'name email phone age bloodGroup')
      .populate('doctor', 'name email doctorProfile');

    res.status(200).json({
      success: true,
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get authenticated patient's own complete medical history (Visits, Diagnoses, Prescriptions, Lab Tests)
// @route GET /api/appointments/my-medical-history
exports.getMyMedicalHistory = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const LabBooking = require('../models/LabBooking');

    const [appointments, labBookings] = await Promise.all([
      Appointment.find({ patient: patientId })
        .populate('doctor', 'name doctorProfile.department')
        .sort({ appointmentDate: -1, createdAt: -1 }),
      LabBooking.find({ patient: patientId })
        .populate('labTest')
        .sort({ bookingDate: -1, createdAt: -1 })
    ]);

    // Aggregate summary
    const completedConsultations = appointments.filter(a => a.status === 'Completed');
    const expiredConsultations = appointments.filter(a => a.status === 'Expired');
    const activePrescriptions = [];
    completedConsultations.forEach(a => {
      if (a.prescriptions && a.prescriptions.length > 0) {
        a.prescriptions.forEach(p => {
          activePrescriptions.push({
            ...p.toObject(),
            doctorName: a.doctorName,
            department: a.department,
            date: a.appointmentDate
          });
        });
      }
    });

    res.status(200).json({
      success: true,
      patient: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
        age: req.user.age,
        gender: req.user.gender,
        bloodGroup: req.user.bloodGroup,
        city: req.user.city,
        hasChronicCondition: req.user.hasChronicCondition,
        chronicDiseases: req.user.chronicDiseases
      },
      summary: {
        totalAppointments: appointments.length,
        completedConsultations: completedConsultations.length,
        expiredConsultations: expiredConsultations.length,
        totalLabTests: labBookings.length,
        totalPrescriptions: activePrescriptions.length
      },
      appointments,
      prescriptions: activePrescriptions,
      labBookings
    });
  } catch (error) {
    next(error);
  }
};
