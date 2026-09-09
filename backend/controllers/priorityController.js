const Appointment = require('../models/Appointment');
const { calculatePriorityScore, reorderDoctorQueue } = require('../services/priorityEngine');
const { emitQueueUpdate, emitAppointmentUpdate } = require('../services/socketService');

// @desc Simulate/Calculate priority score for triage preview
// @route POST /api/priority/calculate
exports.calculateScorePreview = async (req, res, next) => {
  try {
    const { severity, age, hasChronicCondition, isEmergency } = req.body;
    const result = calculatePriorityScore({
      severity,
      age,
      hasChronicCondition,
      isEmergency
    });

    res.status(200).json({
      success: true,
      result
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get real-time priority sorted queue for a doctor
// @route GET /api/priority/queue/:doctorId
exports.getDoctorQueue = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;
    const targetDate = date || new Date().toISOString().split('T')[0];

    const queue = await reorderDoctorQueue(doctorId, targetDate);

    res.status(200).json({
      success: true,
      doctorId,
      date: targetDate,
      count: queue.length,
      queue
    });
  } catch (error) {
    next(error);
  }
};

// @desc Flag appointment as Emergency (Overrides queue position)
// @route POST /api/priority/emergency-override/:appointmentId
exports.emergencyOverride = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const { emergencyReason } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Set emergency flag and recalculate score (+100)
    appointment.isEmergency = true;
    appointment.severity = 'Severe';
    
    const { priorityScore, priorityLevel } = calculatePriorityScore({
      severity: 'Severe',
      age: appointment.patientAge,
      hasChronicCondition: appointment.hasChronicCondition,
      isEmergency: true
    });

    appointment.priorityScore = priorityScore;
    appointment.priorityLevel = priorityLevel;
    if (emergencyReason) {
      appointment.clinicalNotes = `[EMERGENCY OVERRIDE: ${emergencyReason}] ` + (appointment.clinicalNotes || '');
    }

    await appointment.save();

    // Reorder queue so this patient leaps to Position #1
    const updatedQueue = await reorderDoctorQueue(appointment.doctor, appointment.appointmentDate);

    emitQueueUpdate(appointment.doctor, {
      doctorId: appointment.doctor,
      date: appointment.appointmentDate,
      queue: updatedQueue
    });
    emitAppointmentUpdate(appointment.patient, appointment);

    res.status(200).json({
      success: true,
      message: 'Emergency triage override applied successfully! Patient prioritized to front of queue.',
      appointment
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get real-time queue position for a specific patient
// @route GET /api/priority/patient-status/:appointmentId
exports.getPatientQueueStatus = async (req, res, next) => {
  try {
    const { appointmentId } = req.params;
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({ success: false, message: 'Appointment not found' });
    }

    // Get current queue for doctor on appointment date
    const activeQueue = await Appointment.find({
      doctor: appointment.doctor,
      appointmentDate: appointment.appointmentDate,
      status: { $in: ['Confirmed', 'Pending', 'In Progress'] }
    }).sort({
      isEmergency: -1,
      priorityScore: -1,
      createdAt: 1
    });

    const indexInQueue = activeQueue.findIndex(a => a._id.toString() === appointment._id.toString());
    const currentPosition = indexInQueue !== -1 ? indexInQueue + 1 : 0;
    const estimatedWait = Math.max(0, (currentPosition - 1) * 15);

    res.status(200).json({
      success: true,
      appointmentId,
      status: appointment.status,
      queuePosition: currentPosition,
      totalInQueue: activeQueue.length,
      estimatedWaitMinutes: estimatedWait,
      priorityLevel: appointment.priorityLevel,
      priorityScore: appointment.priorityScore,
      isEmergency: appointment.isEmergency
    });
  } catch (error) {
    next(error);
  }
};
