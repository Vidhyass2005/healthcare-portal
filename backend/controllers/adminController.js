const Appointment = require('../models/Appointment');
const User = require('../models/User');
const LabBooking = require('../models/LabBooking');
const LabTest = require('../models/LabTest');
const Notification = require('../models/Notification');
const { emitNotification } = require('../services/socketService');

// @desc Get comprehensive Admin analytics for charts and monitoring
// @route GET /api/admin/analytics
exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'Cancelled' });
    const expiredAppointments = await Appointment.countDocuments({ status: 'Expired' });
    const noShowAppointments = await Appointment.countDocuments({ status: { $in: ['No-Show', 'Expired'] } });
    const highPriorityAppointments = await Appointment.countDocuments({ priorityLevel: 'High' });

    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalLabBookings = await LabBooking.countDocuments();
    const totalAssistanceRequests = await Appointment.countDocuments({
      $or: [
        { 'specialAssistance.wheelchairRequired': true },
        { 'specialAssistance.observationBedRequired': true }
      ]
    });

    // Department Load Distribution
    const departmentLoad = await Appointment.aggregate([
      { $group: { _id: '$department', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Peak Hours Analysis (aggregate by slotTime)
    const peakHours = await Appointment.aggregate([
      { $group: { _id: '$slotTime', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Lab Test Category stats
    const labStats = await LabBooking.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);

    // Priority Distribution
    const priorityDistribution = await Appointment.aggregate([
      { $group: { _id: '$priorityLevel', count: { $sum: 1 } } }
    ]);

    // Recent duplicate / slot conflict checks
    const recentAppointments = await Appointment.find()
      .populate('doctor', 'name doctorProfile.department')
      .sort({ createdAt: -1 })
      .limit(10);

    // No-show / Expired rate
    const noShowRate = totalAppointments > 0
      ? Number(((noShowAppointments / totalAppointments) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      metrics: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        expiredAppointments,
        noShowAppointments,
        noShowRate: `${noShowRate}%`,
        highPriorityAppointments,
        totalPatients,
        totalDoctors,
        totalLabBookings,
        totalAssistanceRequests
      },
      charts: {
        departmentLoad,
        peakHours,
        labStats,
        priorityDistribution
      },
      recentAppointments
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all users (Admin view)
// @route GET /api/admin/users
exports.getAllUsers = async (req, res, next) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role && role !== 'All') {
      query.role = role;
    }

    const users = await User.find(query).select('-password').sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    next(error);
  }
};

// @desc Add a new doctor (Admin)
// @route POST /api/admin/doctors
exports.createDoctor = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      department,
      specialization,
      experienceYears,
      consultationFee,
      roomNumber,
      phone,
      age,
      gender,
      city,
      availableDays,
      slotTimes,
      availabilityStatus
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'A user with this email address already exists' });
    }

    const defaultSlots = [
      '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
      '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM'
    ];

    const defaultDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    const doctor = await User.create({
      name: name.startsWith('Dr.') ? name : `Dr. ${name}`,
      email,
      password: password || 'Doctor@123',
      role: 'doctor',
      phone: phone || '',
      age: age ? Number(age) : 40,
      gender: gender || 'Male',
      city: city || 'Chennai',
      doctorProfile: {
        department: department || 'General Medicine',
        specialization: specialization || 'Consultant Physician',
        experienceYears: experienceYears ? Number(experienceYears) : 5,
        consultationFee: consultationFee ? Number(consultationFee) : 500,
        roomNumber: roomNumber || 'OPD-101',
        availabilityStatus: availabilityStatus || 'Available',
        availableDays: (availableDays && availableDays.length > 0) ? availableDays : defaultDays,
        slotTimes: (slotTimes && slotTimes.length > 0) ? slotTimes : defaultSlots
      }
    });

    res.status(201).json({
      success: true,
      message: `Doctor ${doctor.name} added successfully!`,
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Doctor Details (Admin)
// @route PUT /api/admin/doctors/:id
exports.updateDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      name,
      phone,
      age,
      gender,
      department,
      specialization,
      experienceYears,
      consultationFee,
      roomNumber,
      availabilityStatus,
      availableDays,
      slotTimes
    } = req.body;

    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    if (name) doctor.name = name;
    if (phone) doctor.phone = phone;
    if (age) doctor.age = Number(age);
    if (gender) doctor.gender = gender;

    if (!doctor.doctorProfile) doctor.doctorProfile = {};
    if (department) doctor.doctorProfile.department = department;
    if (specialization) doctor.doctorProfile.specialization = specialization;
    if (experienceYears !== undefined) doctor.doctorProfile.experienceYears = Number(experienceYears);
    if (consultationFee !== undefined) doctor.doctorProfile.consultationFee = Number(consultationFee);
    if (roomNumber) doctor.doctorProfile.roomNumber = roomNumber;
    if (availabilityStatus) doctor.doctorProfile.availabilityStatus = availabilityStatus;
    if (availableDays) doctor.doctorProfile.availableDays = availableDays;
    if (slotTimes) doctor.doctorProfile.slotTimes = slotTimes;

    await doctor.save();

    res.status(200).json({
      success: true,
      message: `Doctor ${doctor.name} updated successfully`,
      doctor
    });
  } catch (error) {
    next(error);
  }
};

// @desc Delete / Deactivate Doctor (Admin)
// @route DELETE /api/admin/doctors/:id
exports.deleteDoctor = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await User.findById(id);
    if (!doctor || doctor.role !== 'doctor') {
      return res.status(404).json({ success: false, message: 'Doctor not found' });
    }

    await User.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: `Doctor ${doctor.name} removed successfully`
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all OPD Bed & Wheelchair assistance requests
// @route GET /api/admin/assistance
exports.getAssistanceRequests = async (req, res, next) => {
  try {
    const { status, date } = req.query;
    let query = {
      $or: [
        { 'specialAssistance.wheelchairRequired': true },
        { 'specialAssistance.observationBedRequired': true }
      ]
    };

    if (status && status !== 'All') {
      query['specialAssistance.status'] = status;
    }
    if (date) {
      query.appointmentDate = date;
    }

    const requests = await Appointment.find(query)
      .populate('patient', 'name phone age gender')
      .populate('doctor', 'name doctorProfile.department')
      .sort({ appointmentDate: -1, createdAt: -1 });

    const totalWheelchair = requests.filter(r => r.specialAssistance?.wheelchairRequired).length;
    const totalObservationBeds = requests.filter(r => r.specialAssistance?.observationBedRequired).length;
    const pendingCount = requests.filter(r => r.specialAssistance?.status === 'Requested').length;
    const assignedCount = requests.filter(r => r.specialAssistance?.status === 'Assigned').length;

    res.status(200).json({
      success: true,
      metrics: {
        totalRequests: requests.length,
        totalWheelchair,
        totalObservationBeds,
        pendingCount,
        assignedCount
      },
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Bed / Wheelchair Assistance Status and Staff/Bed assignment
// @route PUT /api/admin/assistance/:id
exports.updateAssistanceStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, assignedBedNumber, assignedStaffName, notes } = req.body;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    if (!appointment.specialAssistance) {
      appointment.specialAssistance = {};
    }

    if (status) appointment.specialAssistance.status = status;
    if (assignedBedNumber !== undefined) appointment.specialAssistance.assignedBedNumber = assignedBedNumber;
    if (assignedStaffName !== undefined) appointment.specialAssistance.assignedStaffName = assignedStaffName;
    if (notes !== undefined) appointment.specialAssistance.notes = notes;
    appointment.specialAssistance.updatedAt = new Date();

    await appointment.save();

    if (status === 'Assigned') {
      const assistanceNotif = await Notification.create({
        recipient: appointment.patient,
        recipientRole: 'patient',
        title: 'Assistance Confirmed - Porter Assigned',
        message: `Your special assistance request has been assigned. Staff: ${appointment.specialAssistance.assignedStaffName || 'Porter Desk'}${appointment.specialAssistance.assignedBedNumber ? `, Bed: ${appointment.specialAssistance.assignedBedNumber}` : ''}. Our team will assist you upon arrival.`,
        type: 'facility_assistance',
        priority: 'medium',
        metadata: { appointmentId: appointment._id.toString() }
      });
      emitNotification(appointment.patient, 'patient', assistanceNotif);
    }

    res.status(200).json({
      success: true,
      message: 'Assistance request updated successfully',
      specialAssistance: appointment.specialAssistance,
      appointment
    });
  } catch (error) {
    next(error);
  }
};
