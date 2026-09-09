const BloodDonor = require('../models/BloodDonor');
const BloodRequest = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');
const Notification = require('../models/Notification');
const { emitEmergencyBloodAlert } = require('../services/socketService');

// Helper for blood compatibility
// Who can donate to this recipient:
const bloodCompatibilityMap = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], // Universal Recipient
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'] // Universal Donor
};

// Check 90 days eligibility gap
const evaluateEligibility = (lastDonationDate) => {
  if (!lastDonationDate) {
    return { isEligible: true, daysRemaining: 0, nextEligibleDate: new Date() };
  }
  const lastDate = new Date(lastDonationDate);
  const nextEligible = new Date(lastDate);
  nextEligible.setDate(nextEligible.getDate() + 90); // 90-day gap rule

  const now = new Date();
  const diffTime = nextEligible - now;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const isEligible = diffDays <= 0;
  return {
    isEligible,
    daysRemaining: isEligible ? 0 : diffDays,
    nextEligibleDate: nextEligible
  };
};

// @desc Get Blood Bank Inventory
// @route GET /api/blood/inventory
exports.getBloodInventory = async (req, res, next) => {
  try {
    const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
    let inventory = await BloodInventory.find();

    // Auto initialize if empty
    if (inventory.length === 0) {
      const initialStock = bloodGroups.map(bg => ({
        bloodGroup: bg,
        unitsAvailable: Math.floor(Math.random() * 15) + 5,
        criticalThreshold: 5
      }));
      inventory = await BloodInventory.insertMany(initialStock);
    }

    res.status(200).json({
      success: true,
      inventory
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update Blood Stock (Admin/Staff)
// @route PUT /api/blood/inventory/:bloodGroup
exports.updateBloodInventory = async (req, res, next) => {
  try {
    const { bloodGroup } = req.params;
    const { unitsDelta, unitsAvailable, criticalThreshold } = req.body;

    let item = await BloodInventory.findOne({ bloodGroup });
    if (!item) {
      item = new BloodInventory({ bloodGroup, unitsAvailable: 0 });
    }

    if (unitsAvailable !== undefined) {
      item.unitsAvailable = Math.max(0, unitsAvailable);
    } else if (unitsDelta !== undefined) {
      item.unitsAvailable = Math.max(0, item.unitsAvailable + Number(unitsDelta));
    }

    if (criticalThreshold !== undefined) {
      item.criticalThreshold = criticalThreshold;
    }

    item.lastRestockedDate = Date.now();
    await item.save();

    res.status(200).json({
      success: true,
      message: `Inventory for ${bloodGroup} updated successfully`,
      item
    });
  } catch (error) {
    next(error);
  }
};

// @desc Check Donor Eligibility (3-month gap check)
// @route GET /api/blood/eligibility/:donorId
exports.checkEligibility = async (req, res, next) => {
  try {
    const donor = await BloodDonor.findById(req.params.donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor profile not found' });
    }

    const { isEligible, daysRemaining, nextEligibleDate } = evaluateEligibility(donor.lastDonationDate);
    donor.isEligible = isEligible;
    donor.nextEligibleDate = nextEligibleDate;
    await donor.save();

    res.status(200).json({
      success: true,
      isEligible,
      daysRemaining,
      nextEligibleDate,
      lastDonationDate: donor.lastDonationDate
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create Blood Request (Patient / Doctor / Hospital)
// @route POST /api/blood/request
exports.createBloodRequest = async (req, res, next) => {
  try {
    const {
      patientName,
      bloodGroup,
      unitsRequired,
      hospitalName,
      city,
      urgencyLevel,
      reason
    } = req.body;

    const requesterId = req.user ? req.user.id : null;
    const requesterRole = req.user ? req.user.role : 'patient';
    const requesterName = req.user ? req.user.name : patientName;

    const bloodRequest = await BloodRequest.create({
      requester: requesterId,
      requesterName,
      requesterRole,
      patientName: patientName || requesterName,
      bloodGroup,
      unitsRequired: unitsRequired || 1,
      hospitalName: hospitalName || 'MEDCARE HOSPITAL',
      city: city || 'Chennai',
      urgencyLevel: urgencyLevel || 'Urgent (within 12 hrs)',
      reason: reason || 'Urgent transfusion required',
      status: 'Pending'
    });

    // Match compatible donors
    const compatibleGroups = bloodCompatibilityMap[bloodGroup] || [bloodGroup];
    const matchingDonors = await BloodDonor.find({
      bloodGroup: { $in: compatibleGroups },
      isEligible: true,
      availableForEmergency: true
    }).limit(20);

    // If Urgent or Critical, trigger real-time broadcast and notification
    const isCritical = urgencyLevel && urgencyLevel.includes('Critical');
    if (isCritical || requesterRole === 'doctor' || requesterRole === 'admin') {
      bloodRequest.isEmergencyAlertSent = true;
      bloodRequest.status = 'Broadcasted';
      await bloodRequest.save();

      emitEmergencyBloodAlert(bloodRequest);

      // Create global alert notification
      await Notification.create({
        title: `CRITICAL BLOOD ALERT: ${bloodGroup} needed!`,
        message: `${unitsRequired} unit(s) of ${bloodGroup} needed at ${bloodRequest.hospitalName}, ${bloodRequest.city}.`,
        type: 'emergency_blood',
        priority: 'emergency',
        metadata: {
          bloodRequestId: bloodRequest._id.toString(),
          bloodGroup
        }
      });
    }

    res.status(201).json({
      success: true,
      message: 'Blood request submitted successfully',
      bloodRequest,
      matchedDonorCount: matchingDonors.length
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get Blood Requests
// @route GET /api/blood/requests
exports.getBloodRequests = async (req, res, next) => {
  try {
    const { bloodGroup, urgency, status } = req.query;
    let query = {};

    if (bloodGroup && bloodGroup !== 'All') query.bloodGroup = bloodGroup;
    if (status && status !== 'All') query.status = status;
    if (urgency && urgency !== 'All') query.urgencyLevel = urgency;

    const requests = await BloodRequest.find(query).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: requests.length,
      requests
    });
  } catch (error) {
    next(error);
  }
};

// @desc Search & Match Donors for specific blood group and location
// @route GET /api/blood/match-donors
exports.matchDonors = async (req, res, next) => {
  try {
    const { bloodGroup, city } = req.query;
    if (!bloodGroup) {
      return res.status(400).json({ success: false, message: 'Please specify bloodGroup' });
    }

    const compatibleGroups = bloodCompatibilityMap[bloodGroup] || [bloodGroup];
    let query = {
      bloodGroup: { $in: compatibleGroups }
    };

    if (city && city !== 'All') {
      query.city = new RegExp(city, 'i');
    }

    const donors = await BloodDonor.find(query).populate('user', 'email name phone');

    // Add live eligibility data
    const enrichedDonors = donors.map(d => {
      const eligibility = evaluateEligibility(d.lastDonationDate);
      return {
        ...d.toObject(),
        isEligible: eligibility.isEligible,
        daysRemaining: eligibility.daysRemaining,
        nextEligibleDate: eligibility.nextEligibleDate
      };
    });

    res.status(200).json({
      success: true,
      recipientBloodGroup: bloodGroup,
      compatibleGroups,
      count: enrichedDonors.length,
      donors: enrichedDonors
    });
  } catch (error) {
    next(error);
  }
};

// @desc Record a completed donation and restock inventory
// @route POST /api/blood/record-donation
exports.recordDonation = async (req, res, next) => {
  try {
    const { donorId, units = 1, hospitalName = 'MEDCARE HOSPITAL' } = req.body;

    const donor = await BloodDonor.findById(donorId);
    if (!donor) {
      return res.status(404).json({ success: false, message: 'Donor not found' });
    }

    const donationDate = new Date();
    const certificateId = `BLD-CERT-${Date.now().toString().slice(-6)}`;

    donor.lastDonationDate = donationDate;
    donor.isEligible = false;
    const nextDate = new Date(donationDate);
    nextDate.setDate(nextDate.getDate() + 90);
    donor.nextEligibleDate = nextDate;
    donor.donationHistory.push({
      donationDate,
      units: Number(units),
      hospitalName,
      certificateId
    });

    await donor.save();

    // Restock Blood Inventory by +units
    await BloodInventory.findOneAndUpdate(
      { bloodGroup: donor.bloodGroup },
      {
        $inc: { unitsAvailable: Number(units) },
        $set: { lastRestockedDate: donationDate }
      },
      { upsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Donation recorded successfully! Blood inventory updated.',
      donor,
      certificateId
    });
  } catch (error) {
    next(error);
  }
};

// @desc Register new donor directly in Blood Bank Portal
// @route POST /api/blood/register-donor
exports.registerBloodDonor = async (req, res, next) => {
  try {
    const {
      name,
      bloodGroup,
      phone,
      email,
      city,
      locationArea,
      address,
      age,
      gender,
      weightKg,
      lastDonationDate,
      hasChronicDiseases,
      chronicDiseases,
      hadRecentSurgery,
      surgeryDetails,
      hadTattooRecently,
      hemoglobinLevel,
      notes
    } = req.body;

    if (!name || !bloodGroup || !phone || !city || !age) {
      return res.status(400).json({
        success: false,
        message: 'Name, blood group, phone number, city, and age are required.'
      });
    }

    const { isEligible, daysRemaining, nextEligibleDate } = evaluateEligibility(lastDonationDate || null);

    const donor = await BloodDonor.create({
      user: req.user ? req.user.id : null,
      name,
      bloodGroup,
      phone,
      email: email || (req.user ? req.user.email : ''),
      city,
      locationArea: locationArea || 'Central',
      address: address || '',
      age: Number(age),
      gender: gender || 'Male',
      weightKg: Number(weightKg) || 65,
      lastDonationDate: lastDonationDate || null,
      isEligible,
      nextEligibleDate,
      availableForEmergency: true,
      medicalHistory: {
        hasChronicDiseases: Boolean(hasChronicDiseases),
        chronicDiseases: Array.isArray(chronicDiseases) ? chronicDiseases : (chronicDiseases ? chronicDiseases.split(',').map(s => s.trim()).filter(Boolean) : []),
        hadRecentSurgery: Boolean(hadRecentSurgery),
        surgeryDetails: surgeryDetails || '',
        hadTattooRecently: Boolean(hadTattooRecently),
        hemoglobinLevel: Number(hemoglobinLevel) || 13.5,
        notes: notes || 'Registered voluntarily via Blood Bank Portal'
      },
      status: 'Active'
    });

    res.status(201).json({
      success: true,
      message: 'Blood Donor successfully registered in the repository!',
      donor
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get all registered donors (Admin view of existing users)
// @route GET /api/blood/donors/admin
exports.getAllDonorsAdmin = async (req, res, next) => {
  try {
    const { bloodGroup, city, isEligible, search } = req.query;
    let query = {};

    if (bloodGroup && bloodGroup !== 'All') query.bloodGroup = bloodGroup;
    if (city && city !== 'All') query.city = new RegExp(city, 'i');
    if (isEligible !== undefined && isEligible !== 'All') {
      query.isEligible = isEligible === 'true' || isEligible === true;
    }
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { city: new RegExp(search, 'i') }
      ];
    }

    const donors = await BloodDonor.find(query)
      .populate('user', 'email name role createdAt')
      .sort({ createdAt: -1 });

    const totalDonors = await BloodDonor.countDocuments();
    const eligibleCount = donors.filter(d => d.isEligible).length;

    res.status(200).json({
      success: true,
      totalCount: totalDonors,
      count: donors.length,
      eligibleCount,
      donors
    });
  } catch (error) {
    next(error);
  }
};
