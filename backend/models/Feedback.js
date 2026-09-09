const mongoose = require('mongoose');

const feedbackSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  patientName: {
    type: String,
    required: true
  },
  patientEmail: {
    type: String,
    default: ''
  },
  patientPhone: {
    type: String,
    default: ''
  },
  rating: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  category: {
    type: String,
    enum: ['OPD Consultation', 'Blood Bank Service', 'Diagnostic Lab Tests', 'Staff & Nursing', 'Overall Hospital Facility'],
    default: 'OPD Consultation'
  },
  doctorOrDepartment: {
    type: String,
    default: 'General'
  },
  consultationQuestions: {
    doctorExplanation: {
      type: String,
      enum: ['Excellent', 'Good', 'Average', 'Needs Improvement'],
      default: 'Good'
    },
    waitTimeSatisfaction: {
      type: String,
      enum: ['Prompt / On Time', 'Acceptable (<20 min)', 'Long Wait (>30 min)'],
      default: 'Acceptable (<20 min)'
    },
    staffCourteousness: {
      type: String,
      enum: ['Very Polite', 'Helpful', 'Indifferent', 'Unhelpful'],
      default: 'Helpful'
    },
    cleanlinessRating: {
      type: String,
      enum: ['Spotless', 'Clean & Hygienic', 'Average', 'Poor'],
      default: 'Clean & Hygienic'
    },
    wouldRecommend: {
      type: String,
      enum: ['Definitely Yes', 'Probably', 'Not Sure', 'No'],
      default: 'Definitely Yes'
    }
  },
  comments: {
    type: String,
    required: [true, 'Please provide feedback comments'],
    trim: true
  },
  status: {
    type: String,
    enum: ['Submitted', 'Reviewed', 'Resolved'],
    default: 'Submitted'
  },
  adminReply: {
    type: String,
    default: ''
  }
}, { timestamps: true });

module.exports = mongoose.model('Feedback', feedbackSchema);
