const mongoose = require('mongoose');

const labBookingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientPhone: {
    type: String,
    default: ''
  },
  labTest: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LabTest',
    required: true
  },
  testName: {
    type: String,
    required: true
  },
  bookingDate: {
    type: String, // YYYY-MM-DD
    required: true
  },
  slotTime: {
    type: String, // e.g. "08:30 AM"
    required: true
  },
  isHomeSampleCollection: {
    type: Boolean,
    default: false
  },
  collectionAddress: {
    type: String,
    default: ''
  },
  linkedAppointment: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Appointment',
    default: null
  },
  referringDoctor: {
    type: String,
    default: ''
  },
  totalAmount: {
    type: Number,
    required: true
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Cash on Collection'],
    default: 'Paid'
  },
  priorityLevel: {
    type: String,
    enum: ['High', 'Normal', 'Urgent'],
    default: 'Normal'
  },
  status: {
    type: String,
    enum: ['Booked', 'Sample Collected', 'Processing', 'Report Ready', 'Completed', 'Cancelled'],
    default: 'Booked'
  },
  reportData: {
    generatedDate: Date,
    reportSummary: String,
    findings: [{
      parameter: String,
      result: String,
      referenceRange: String,
      unit: String,
      isAbnormal: Boolean
    }],
    doctorRemarks: String,
    pdfUrl: String
  }
}, { timestamps: true });

module.exports = mongoose.model('LabBooking', labBookingSchema);
