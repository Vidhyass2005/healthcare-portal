const mongoose = require('mongoose');

const labTestSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    enum: ['Pathology', 'Radiology', 'Cardiology', 'Biochemistry', 'Microbiology'],
    default: 'Pathology'
  },
  code: {
    type: String,
    required: true,
    unique: true
  },
  description: {
    type: String,
    default: ''
  },
  price: {
    type: Number,
    required: true
  },
  sampleType: {
    type: String,
    default: 'Blood'
  },
  fastingRequired: {
    type: Boolean,
    default: false
  },
  preparationInstructions: {
    type: String,
    default: 'No special preparation needed.'
  },
  turnaroundHours: {
    type: Number,
    default: 24
  },
  dailyCapacity: {
    type: Number,
    default: 30
  },
  isHomeSampleAvailable: {
    type: Boolean,
    default: true
  },
  recommendedForSymptoms: {
    type: [String],
    default: []
  }
}, { timestamps: true });

module.exports = mongoose.model('LabTest', labTestSchema);
