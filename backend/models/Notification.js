const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null means broadcast or role-based
  },
  recipientRole: {
    type: String,
    enum: ['all', 'patient', 'doctor', 'admin', 'donor'],
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
    enum: ['emergency_blood', 'appointment_update', 'queue_alert', 'lab_report_ready', 'general'],
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
    bloodRequestId: String,
    bloodGroup: String,
    hospitalName: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
