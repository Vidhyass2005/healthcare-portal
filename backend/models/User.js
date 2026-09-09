const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Please provide an email'],
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Please provide a password'],
    minlength: 6,
    select: false
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin', 'donor'],
    default: 'patient'
  },
  phone: {
    type: String,
    default: ''
  },
  age: {
    type: Number,
    default: 30
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    default: 'Male'
  },
  bloodGroup: {
    type: String,
    enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown'],
    default: 'Unknown'
  },
  city: {
    type: String,
    default: 'Chennai'
  },
  chronicDiseases: {
    type: [String],
    default: []
  },
  hasChronicCondition: {
    type: Boolean,
    default: false
  },
  // Doctor specific fields
  doctorProfile: {
    department: {
      type: String,
      default: 'General Medicine'
    },
    specialization: {
      type: String,
      default: ''
    },
    experienceYears: {
      type: Number,
      default: 5
    },
    consultationFee: {
      type: Number,
      default: 500
    },
    availabilityStatus: {
      type: String,
      enum: ['Available', 'In Consultation', 'On Leave', 'Offline'],
      default: 'Available'
    },
    roomNumber: {
      type: String,
      default: 'OPD-101'
    },
    availableDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    },
    slotTimes: {
      type: [String],
      default: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM']
    }
  },
  // Donor specific fields
  donorProfile: {
    lastDonationDate: {
      type: Date,
      default: null
    },
    totalDonations: {
      type: Number,
      default: 0
    },
    isAvailableForEmergency: {
      type: Boolean,
      default: true
    },
    healthConditions: {
      type: String,
      default: 'Healthy'
    },
    weightKg: {
      type: Number,
      default: 65
    }
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Encrypt password before saving
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    return next();
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Match user password
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
