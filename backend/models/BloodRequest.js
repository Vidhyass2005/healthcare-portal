const mongoose = require('mongoose');

const bloodRequestSchema = new mongoose.Schema({
  requester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  requesterName: {
    type: String,
    required: true
  },
  requesterRole: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    default: 'patient'
  },
  patientName: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  unitsRequired: {
    type: Number,
    required: true,
    min: 1
  },
  hospitalName: {
    type: String,
    default: 'MEDCARE HOSPITAL'
  },
  city: {
    type: String,
    default: 'Chennai'
  },
  urgencyLevel: {
    type: String,
    enum: ['Critical / Immediate', 'Urgent (within 12 hrs)', 'Standard (within 24-48 hrs)'],
    default: 'Urgent (within 12 hrs)'
  },
  isEmergencyAlertSent: {
    type: Boolean,
    default: false
  },
  reason: {
    type: String,
    default: 'Surgical Procedure / Emergency'
  },
  status: {
    type: String,
    enum: ['Pending', 'Broadcasted', 'Fulfilled', 'Cancelled'],
    default: 'Pending'
  },
  matchedDonors: [{
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'BloodDonor'
    },
    contactedAt: Date,
    responseStatus: {
      type: String,
      enum: ['Not Contacted', 'Pledged', 'Declined', 'Completed'],
      default: 'Not Contacted'
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model('BloodRequest', bloodRequestSchema);
