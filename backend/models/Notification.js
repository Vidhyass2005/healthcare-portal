const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means broadcast or role-based
  },
  recipientRole: {
    type: String,
    enum: ['all', 'patient', 'doctor', 'admin'],
    default: 'all'
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: [
      'appointment_update',
      'queue_alert',
      'lab_report_ready',
      'prescription_ready',
      'facility_assistance',
      'feedback_alert',
      'emergency_alert',
      'general'
    ],
    default: 'general'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'emergency'],
    default: 'medium'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  metadata: {
    appointmentId: String,
    labBookingId: String,
    feedbackId: String,
    department: String,
    targetUrl: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
