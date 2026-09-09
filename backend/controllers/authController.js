const jwt = require('jsonwebtoken');
const User = require('../models/User');
const BloodDonor = require('../models/BloodDonor');

// Generate JWT token
const sendTokenResponse = (user, statusCode, res) => {
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'super_secret_healthcare_jwt_key_2026_secure',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      age: user.age,
      gender: user.gender,
      bloodGroup: user.bloodGroup,
      city: user.city,
      hasChronicCondition: user.hasChronicCondition,
      chronicDiseases: user.chronicDiseases,
      doctorProfile: user.doctorProfile,
      donorProfile: user.donorProfile
    }
  });
};

// @desc Register user
// @route POST /api/auth/register
exports.register = async (req, res, next) => {
  try {
    const {
      name,
      email,
      password,
      role,
      phone,
      age,
      gender,
      bloodGroup,
      city,
      hasChronicCondition,
      chronicDiseases,
      doctorProfile,
      donorProfile
    } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'An account with this email already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'patient',
      phone: phone || '',
      age: age ? Number(age) : 30,
      gender: gender || 'Male',
      bloodGroup: bloodGroup || 'O+',
      city: city || 'Chennai',
      hasChronicCondition: Boolean(hasChronicCondition),
      chronicDiseases: chronicDiseases || [],
      doctorProfile: doctorProfile || {},
      donorProfile: donorProfile || {}
    });

    // If registered as donor, also initialize BloodDonor document
    if (user.role === 'donor') {
      await BloodDonor.create({
        user: user._id,
        name: user.name,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        city: user.city,
        age: user.age,
        weightKg: (donorProfile && donorProfile.weightKg) || 65,
        lastDonationDate: (donorProfile && donorProfile.lastDonationDate) || null,
        isEligible: true,
        availableForEmergency: true,
        status: 'Active'
      });
    }

    sendTokenResponse(user, 201, res);
  } catch (error) {
    next(error);
  }
};

// @desc Login user
// @route POST /api/auth/login
exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    sendTokenResponse(user, 200, res);
  } catch (error) {
    next(error);
  }
};

// @desc Get current user profile
// @route GET /api/auth/me
exports.getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    let donorData = null;

    if (user.role === 'donor') {
      donorData = await BloodDonor.findOne({ user: user._id });
    }

    res.status(200).json({
      success: true,
      user,
      donorData
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get list of all doctors (public or authenticated)
// @route GET /api/auth/doctors
exports.getDoctors = async (req, res, next) => {
  try {
    const { department } = req.query;
    let query = { role: 'doctor' };
    if (department && department !== 'All') {
      query['doctorProfile.department'] = department;
    }

    const doctors = await User.find(query).select('-password');
    res.status(200).json({
      success: true,
      count: doctors.length,
      doctors
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update user profile
// @route PUT /api/auth/profile
exports.updateProfile = async (req, res, next) => {
  try {
    const fieldsToUpdate = {
      name: req.body.name,
      phone: req.body.phone,
      age: req.body.age,
      city: req.body.city,
      bloodGroup: req.body.bloodGroup,
      hasChronicCondition: req.body.hasChronicCondition,
      chronicDiseases: req.body.chronicDiseases
    };

    if (req.user.role === 'doctor' && req.body.doctorProfile) {
      fieldsToUpdate.doctorProfile = req.body.doctorProfile;
    }

    if (req.user.role === 'donor' && req.body.donorProfile) {
      fieldsToUpdate.donorProfile = req.body.donorProfile;
      await BloodDonor.findOneAndUpdate(
        { user: req.user._id },
        {
          name: req.body.name,
          phone: req.body.phone,
          bloodGroup: req.body.bloodGroup,
          city: req.body.city,
          age: req.body.age,
          lastDonationDate: req.body.donorProfile.lastDonationDate
        }
      );
    }

    const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      user
    });
  } catch (error) {
    next(error);
  }
};
