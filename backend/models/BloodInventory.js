const mongoose = require('mongoose');

const bloodInventorySchema = new mongoose.Schema({
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
    required: true,
    unique: true
  },
  unitsAvailable: {
    type: Number,
    required: true,
    default: 10,
    min: 0
  },
  criticalThreshold: {
    type: Number,
    default: 5
  },
  lastRestockedDate: {
    type: Date,
    default: Date.now
  },
  reservedUnits: {
    type: Number,
    default: 0
  }
}, { timestamps: true });

module.exports = mongoose.model('BloodInventory', bloodInventorySchema);
