const LabTest = require('../models/LabTest');
const LabBooking = require('../models/LabBooking');
const Notification = require('../models/Notification');
const { emitLabReportReady } = require('../services/socketService');

// Sample test recommendation rules
const symptomTestRules = [
  { keywords: ['chest pain', 'heart', 'palpitation', 'breathless', 'hypertension'], tests: ['ECG-01', 'LIP-01', 'TROP-01'] },
  { keywords: ['fever', 'chills', 'fatigue', 'infection', 'weakness'], tests: ['CBC-01', 'CRP-01', 'TYP-01'] },
  { keywords: ['diabetes', 'sugar', 'frequent urination', 'thirst'], tests: ['HBA1C-01', 'GLU-01', 'LIP-01'] },
  { keywords: ['joint pain', 'back pain', 'bone', 'fracture', 'injury'], tests: ['XRAY-01', 'MRI-01', 'VITD-01'] },
  { keywords: ['jaundice', 'liver', 'abdominal pain', 'nausea'], tests: ['LFT-01', 'USG-01'] },
  { keywords: ['headache', 'migraine', 'dizziness', 'seizure'], tests: ['MRI-01', 'CBC-01'] }
];

// @desc Get all lab tests catalog
// @route GET /api/lab/tests
exports.getLabTests = async (req, res, next) => {
  try {
    const { category, search, fasting } = req.query;
    let query = {};

    if (category && category !== 'All') {
      query.category = category;
    }

    if (fasting !== undefined && fasting !== 'All') {
      query.fastingRequired = fasting === 'true';
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } }
      ];
    }

    const tests = await LabTest.find(query).sort({ category: 1, name: 1 });
    res.status(200).json({
      success: true,
      count: tests.length,
      tests
    });
  } catch (error) {
    next(error);
  }
};

// @desc Book a lab test slot
// @route POST /api/lab/book
exports.bookLabTest = async (req, res, next) => {
  try {
    // Restrict booking: Doctors and Administrators cannot book lab tests
    if (req.user.role === 'admin' || req.user.role === 'doctor') {
      return res.status(403).json({
        success: false,
        message: 'Lab test booking is reserved for patients only. Doctors and administrators cannot book diagnostic slots.'
      });
    }

    const {
      labTestId,
      bookingDate,
      slotTime,
      isHomeSampleCollection,
      collectionAddress,
      linkedAppointment,
      referringDoctor,
      priorityLevel,
      paymentStatus
    } = req.body;

    const patientId = req.user.id;

    const test = await LabTest.findById(labTestId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    // Check capacity for that day
    const existingBookingsCount = await LabBooking.countDocuments({
      labTest: labTestId,
      bookingDate,
      status: { $ne: 'Cancelled' }
    });

    if (existingBookingsCount >= test.dailyCapacity) {
      return res.status(400).json({
        success: false,
        message: `Maximum daily capacity (${test.dailyCapacity} slots) reached for ${test.name} on ${bookingDate}. Please choose another date.`
      });
    }

    const homeCollectionFee = isHomeSampleCollection ? 150 : 0;
    const totalAmount = test.price + homeCollectionFee;

    const labBooking = await LabBooking.create({
      patient: patientId,
      patientName: req.user.name,
      patientPhone: req.user.phone || '',
      labTest: test._id,
      testName: test.name,
      bookingDate,
      slotTime: slotTime || '09:00 AM',
      isHomeSampleCollection: Boolean(isHomeSampleCollection),
      collectionAddress: collectionAddress || req.user.city || '',
      linkedAppointment: linkedAppointment || null,
      referringDoctor: referringDoctor || 'Self / General OPD',
      totalAmount,
      paymentStatus: paymentStatus || 'Paid',
      priorityLevel: priorityLevel || 'Normal',
      status: 'Booked'
    });

    // Create confirmation notification
    await Notification.create({
      recipient: patientId,
      title: 'Lab Test Booked Successfully',
      message: `Your booking for ${test.name} on ${bookingDate} at ${slotTime} is confirmed. ${isHomeSampleCollection ? 'Home sample collection is scheduled.' : 'Please visit the diagnostic lab.'}`,
      type: 'general',
      priority: 'medium',
      metadata: { labBookingId: labBooking._id.toString() }
    });

    res.status(201).json({
      success: true,
      message: 'Lab test booked successfully',
      booking: labBooking
    });
  } catch (error) {
    next(error);
  }
};

// @desc Get lab bookings
// @route GET /api/lab/bookings
exports.getLabBookings = async (req, res, next) => {
  try {
    let query = {};
    const { status, date } = req.query;

    if (req.user.role === 'patient') {
      query.patient = req.user.id;
    }

    if (status && status !== 'All') {
      query.status = status;
    }

    if (date) {
      query.bookingDate = date;
    }

    const bookings = await LabBooking.find(query)
      .populate('labTest')
      .populate('patient', 'name email phone age gender')
      .populate('linkedAppointment')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: bookings.length,
      bookings
    });
  } catch (error) {
    next(error);
  }
};

// @desc Update lab test booking status & attach report findings
// @route PUT /api/lab/bookings/:id/status
exports.updateBookingStatus = async (req, res, next) => {
  try {
    const { status, findings, reportSummary, doctorRemarks } = req.body;
    const booking = await LabBooking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Lab booking not found' });
    }

    if (status) booking.status = status;

    if (findings || reportSummary || status === 'Report Ready' || status === 'Completed') {
      booking.reportData = {
        generatedDate: new Date(),
        reportSummary: reportSummary || 'Investigation completed within expected clinical thresholds.',
        findings: findings || [
          { parameter: 'Hemoglobin (Hb)', result: '14.2', referenceRange: '13.0 - 17.0', unit: 'g/dL', isAbnormal: false },
          { parameter: 'Total WBC Count', result: '7,500', referenceRange: '4,000 - 11,000', unit: 'cells/cu.mm', isAbnormal: false },
          { parameter: 'Platelet Count', result: '240,000', referenceRange: '150,000 - 450,000', unit: '/mcL', isAbnormal: false }
        ],
        doctorRemarks: doctorRemarks || 'Normal clinical findings. Maintain healthy routine.',
        pdfUrl: `/api/lab/reports/${booking._id}/download`
      };

      // Emit report ready real-time notification
      emitLabReportReady(booking.patient, booking);
    }

    await booking.save();

    res.status(200).json({
      success: true,
      message: `Booking status updated to ${booking.status}`,
      booking
    });
  } catch (error) {
    next(error);
  }
};

// @desc Smart lab test recommendations based on symptoms
// @route POST /api/lab/recommend
exports.recommendTests = async (req, res, next) => {
  try {
    const { symptoms = '' } = req.body;
    const lowerSymptoms = symptoms.toLowerCase();

    let matchedCodes = new Set();

    symptomTestRules.forEach(rule => {
      const matchFound = rule.keywords.some(kw => lowerSymptoms.includes(kw));
      if (matchFound) {
        rule.tests.forEach(code => matchedCodes.add(code));
      }
    });

    // If no specific match, recommend default general checkup tests
    if (matchedCodes.size === 0) {
      ['CBC-01', 'LIP-01', 'GLU-01'].forEach(c => matchedCodes.add(c));
    }

    const recommendedTests = await LabTest.find({
      code: { $in: Array.from(matchedCodes) }
    });

    res.status(200).json({
      success: true,
      symptoms,
      count: recommendedTests.length,
      recommendedTests
    });
  } catch (error) {
    next(error);
  }
};

// @desc Create a new diagnostic lab test in catalog
// @route POST /api/lab/tests
exports.createLabTest = async (req, res, next) => {
  try {
    const {
      name,
      category,
      code,
      description,
      price,
      sampleType,
      fastingRequired,
      preparationInstructions,
      turnaroundHours,
      dailyCapacity,
      isHomeSampleAvailable,
      recommendedForSymptoms
    } = req.body;

    if (!name || !code || !price) {
      return res.status(400).json({
        success: false,
        message: 'Test name, unique code, and price are required.'
      });
    }

    const cleanCode = code.trim().toUpperCase();
    const existingTest = await LabTest.findOne({ code: cleanCode });
    if (existingTest) {
      return res.status(400).json({
        success: false,
        message: `A lab test with code ${cleanCode} already exists.`
      });
    }

    const symptomsArray = Array.isArray(recommendedForSymptoms)
      ? recommendedForSymptoms
      : typeof recommendedForSymptoms === 'string'
      ? recommendedForSymptoms.split(',').map(s => s.trim().toLowerCase()).filter(Boolean)
      : [];

    const newTest = await LabTest.create({
      name: name.trim(),
      category: category || 'Pathology',
      code: cleanCode,
      description: description ? description.trim() : '',
      price: Number(price),
      sampleType: sampleType || 'Blood',
      fastingRequired: Boolean(fastingRequired),
      preparationInstructions: preparationInstructions || 'No special preparation needed.',
      turnaroundHours: Number(turnaroundHours) || 24,
      dailyCapacity: Number(dailyCapacity) || 30,
      isHomeSampleAvailable: isHomeSampleAvailable !== undefined ? Boolean(isHomeSampleAvailable) : true,
      recommendedForSymptoms: symptomsArray
    });

    res.status(201).json({
      success: true,
      message: `Diagnostic investigation "${newTest.name}" (${newTest.code}) added to catalog successfully.`,
      test: newTest
    });
  } catch (error) {
    next(error);
  }
};
