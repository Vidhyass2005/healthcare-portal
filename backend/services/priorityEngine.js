/**
 * Clinical Priority Scoring & Queue Engine
 * 
 * Formula:
 * Priority Score = (Severity × 5) + (Age Factor × 2) + (Chronic Disease × 3)
 * 
 * Scoring Weights:
 * - Severity: Severe = 3, Moderate = 2, Mild = 1
 * - Age Factor: > 65 = 3, 45-64 = 2, < 45 = 1
 * - Chronic Disease: Yes = 2, No = 0
 * - Emergency Flag: +100 override score
 */

const Appointment = require('../models/Appointment');

const calculatePriorityScore = ({ severity = 'Mild', age = 30, hasChronicCondition = false, isEmergency = false }) => {
  // 1. Severity Factor
  let severityScore = 1;
  const sevLower = severity.toLowerCase();
  if (sevLower === 'severe') {
    severityScore = 3;
  } else if (sevLower === 'moderate') {
    severityScore = 2;
  } else {
    severityScore = 1;
  }

  // 2. Age Factor
  let ageScore = 1;
  const numAge = Number(age) || 30;
  if (numAge >= 65) {
    ageScore = 3;
  } else if (numAge >= 45) {
    ageScore = 2;
  } else {
    ageScore = 1;
  }

  // 3. Chronic Disease Factor
  const chronicScore = hasChronicCondition ? 2 : 0;

  // Base Calculation
  let baseScore = (severityScore * 5) + (ageScore * 2) + (chronicScore * 3);

  // Emergency override
  if (isEmergency) {
    baseScore += 100;
  }

  // Priority Level categorization
  let priorityLevel = 'Low';
  if (isEmergency || baseScore >= 20) {
    priorityLevel = 'High';
  } else if (baseScore >= 12) {
    priorityLevel = 'Moderate';
  } else {
    priorityLevel = 'Low';
  }

  return {
    priorityScore: baseScore,
    priorityLevel,
    breakdown: {
      severityScore: severityScore * 5,
      ageScore: ageScore * 2,
      chronicScore: chronicScore * 3,
      emergencyBonus: isEmergency ? 100 : 0
    }
  };
};

/**
 * Re-orders a doctor's active daily queue by clinical priority and updates wait times.
 */
const reorderDoctorQueue = async (doctorId, appointmentDate) => {
  try {
    const activeAppointments = await Appointment.find({
      doctor: doctorId,
      appointmentDate: appointmentDate,
      status: { $in: ['Confirmed', 'Pending', 'In Progress'] }
    }).sort({
      isEmergency: -1,
      priorityScore: -1,
      createdAt: 1
    });

    const averageConsultationMinutes = 15;

    // Update each appointment's position and estimated wait time
    for (let index = 0; index < activeAppointments.length; index++) {
      const appt = activeAppointments[index];
      const newQueuePosition = index + 1;
      const waitTime = Math.max(0, (newQueuePosition - 1) * averageConsultationMinutes);

      appt.queuePosition = newQueuePosition;
      appt.estimatedWaitMinutes = waitTime;
      await appt.save();
    }

    return activeAppointments;
  } catch (error) {
    console.error('Error reordering queue:', error);
    return [];
  }
};

module.exports = {
  calculatePriorityScore,
  reorderDoctorQueue
};
