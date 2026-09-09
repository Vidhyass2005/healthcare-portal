const Appointment = require('../models/Appointment');
const User = require('../models/User');
const BloodInventory = require('../models/BloodInventory');
const BloodRequest = require('../models/BloodRequest');
const LabBooking = require('../models/LabBooking');
const LabTest = require('../models/LabTest');

// @desc Get comprehensive Admin analytics for charts and monitoring
// @route GET /api/admin/analytics
exports.getAnalyticsSummary = async (req, res, next) => {
  try {
    const totalAppointments = await Appointment.countDocuments();
    const completedAppointments = await Appointment.countDocuments({ status: 'Completed' });
    const cancelledAppointments = await Appointment.countDocuments({ status: 'Cancelled' });
    const noShowAppointments = await Appointment.countDocuments({ status: 'No-Show' });
    const highPriorityAppointments = await Appointment.countDocuments({ priorityLevel: 'High' });

    const totalPatients = await User.countDocuments({ role: 'patient' });
    const totalDoctors = await User.countDocuments({ role: 'doctor' });
    const totalDonors = await User.countDocuments({ role: 'donor' });
    const totalLabBookings = await LabBooking.countDocuments();

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

    // Blood Inventory stock levels
    const bloodStock = await BloodInventory.find().sort({ bloodGroup: 1 });
    const criticalBloodAlerts = bloodStock.filter(b => b.unitsAvailable <= b.criticalThreshold);

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

    // No-show rate
    const noShowRate = totalAppointments > 0
      ? Number(((noShowAppointments / totalAppointments) * 100).toFixed(1))
      : 0;

    res.status(200).json({
      success: true,
      metrics: {
        totalAppointments,
        completedAppointments,
        cancelledAppointments,
        noShowAppointments,
        noShowRate: `${noShowRate}%`,
        highPriorityAppointments,
        totalPatients,
        totalDoctors,
        totalDonors,
        totalLabBookings,
        criticalBloodAlertCount: criticalBloodAlerts.length
      },
      charts: {
        departmentLoad,
        peakHours,
        bloodStock,
        labStats,
        priorityDistribution
      },
      criticalBloodAlerts,
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
