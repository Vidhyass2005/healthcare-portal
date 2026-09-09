const mongoose = require('mongoose');

const bloodDonorSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  name: {
    type: String,
    required: true
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  email: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    required: true
  },
  locationArea: {
    type: String,
    default: 'Central'
  },
  address: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    required: true
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  weightKg: {
    type: Number,
    default: 65
  },
  lastDonationDate: {
    type: Date,
    default: null
  },
  isEligible: {
    type: Boolean,
    default: true
  },
  nextEligibleDate: {
    type: Date,
    default: Date.now
  },
  availableForEmergency: {
    type: Boolean,
    default: true
  },
  medicalHistory: {
    hasChronicDiseases: {
      type: Boolean,
      default: false
    },
    chronicDiseases: {
      type: [String],
      default: []
    },
    hadRecentSurgery: {
      type: Boolean,
      default: false
    },
    surgeryDetails: {
      type: String,
      default: ''
    },
    hadTattooRecently: {
      type: Boolean,
      default: false
    },
    hemoglobinLevel: {
      type: Number,
      default: 13.5
    },
    notes: {
      type: String,
      default: 'Fit to donate blood'
    }
  },
  donationHistory: [{
    donationDate: {
      type: Date,
      default: Date.now
    },
    units: {
      type: Number,
      default: 1
    },
    hospitalName: {
      type: String,
      default: 'MEDCARE HOSPITAL'
    },
    certificateId: {
      type: String,
      default: ''
    }
  }],
  status: {
    type: String,
    enum: ['Active', 'Temporarily Ineligible', 'Inactive'],
    default: 'Active'
  }
}, { timestamps: true });

module.exports = mongoose.model('BloodDonor', bloodDonorSchema);
