const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientAge: {
    type: Number,
    required: true
  },
  patientGender: {
    type: String,
    default: 'Male'
  },
  patientPhone: {
    type: String,
    default: ''
  },
  doctor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorName: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  appointmentDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  slotTime: {
    type: String, // e.g. "10:00 AM"
    required: true
  },
  symptoms: {
    type: String,
    default: ''
  },
  severity: {
    type: String,
    enum: ['Mild', 'Moderate', 'Severe'],
    default: 'Mild'
  },
  hasChronicCondition: {
    type: Boolean,
    default: false
  },
  chronicDiseases: {
    type: [String],
    default: []
  },
  isEmergency: {
    type: Boolean,
    default: false
  },
  priorityScore: {
    type: Number,
    default: 0
  },
  priorityLevel: {
    type: String,
    enum: ['High', 'Moderate', 'Low'],
    default: 'Low'
  },
  queuePosition: {
    type: Number,
    default: 1
  },
  estimatedWaitMinutes: {
    type: Number,
    default: 15
  },
  status: {
    type: String,
    enum: ['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled', 'No-Show'],
    default: 'Confirmed'
  },
  clinicalNotes: {
    type: String,
    default: ''
  },
  prescriptions: [{
    medicine: String,
    dosage: String,
    frequency: String,
    duration: String
  }],
  recommendedLabTests: {
    type: [String],
    default: []
  },
  // Patient Vitals Charting
  vitals: {
    bloodPressureSystolic: { type: Number, default: null },
    bloodPressureDiastolic: { type: Number, default: null },
    pulseHeartRate: { type: Number, default: null },
    oxygenSaturation: { type: Number, default: null },
    temperature: { type: Number, default: null },
    heightCm: { type: Number, default: null },
    weightKg: { type: Number, default: null },
    bmi: { type: Number, default: null },
    bmiCategory: { type: String, default: 'Normal' },
    bloodSugarMgDl: { type: Number, default: null }
  },
  // Patient Clinical Alerts & Drug Allergies
  allergies: {
    type: [String],
    default: []
  },
  medicalAlerts: {
    type: [String],
    default: []
  },
  // Cross-Department Outgoing Referral
  referral: {
    isReferred: { type: Boolean, default: false },
    referredToDepartment: { type: String, default: '' },
    referredToDoctor: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    referredToDoctorName: { type: String, default: '' },
    referralReason: { type: String, default: '' },
    referralUrgency: { type: String, enum: ['Routine', 'Urgent', 'Immediate STAT'], default: 'Routine' },
    referralDate: { type: Date, default: null },
    referralStatus: { type: String, enum: ['Pending Evaluation', 'Consulted', 'Declined'], default: 'Pending Evaluation' }
  },
  // Cross-Department Incoming Referral Flag
  isReferralPatient: {
    type: Boolean,
    default: false
  },
  // Follow-Up Visit Scheduling
  followUp: {
    isFollowUpRequired: { type: Boolean, default: false },
    followUpDate: { type: String, default: null }, // YYYY-MM-DD
    followUpSlot: { type: String, default: '10:00 AM' },
    followUpInstructions: { type: String, default: '' },
    followUpStatus: { type: String, enum: ['Scheduled', 'Completed', 'Cancelled', 'None'], default: 'None' },
    followUpAppointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', default: null }
  },
  referredByDoctorName: {
    type: String,
    default: ''
  },
  referredByDepartment: {
    type: String,
    default: ''
  },
  referralReason: {
    type: String,
    default: ''
  },
  noShowRiskScore: {
    type: Number,
    default: 0.1
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

// Prevent double booking for the same doctor at the same date and slot unless cancelled
appointmentSchema.index(
  { doctor: 1, appointmentDate: 1, slotTime: 1, status: 1 }
);

module.exports = mongoose.model('Appointment', appointmentSchema);
