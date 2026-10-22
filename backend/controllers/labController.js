const LabTest = require('../models/LabTest');
const LabBooking = require('../models/LabBooking');
const Notification = require('../models/Notification');
const { emitLabReportReady, emitNotification } = require('../services/socketService');

// Default Diagnostic Lab Tests Catalog for self-seeding
const DEFAULT_LAB_TESTS = [
  {
    name: 'Complete Blood Count (CBC) with ESR',
    category: 'Pathology',
    code: 'CBC-01',
    description: 'Comprehensive screening test evaluating red blood cells, white blood cells, platelets, and infection markers.',
    price: 450,
    sampleType: 'Blood',
    fastingRequired: false,
    preparationInstructions: 'No special preparation needed.',
    turnaroundHours: 12,
    dailyCapacity: 40,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['fever', 'fatigue', 'infection', 'anemia', 'weakness']
  },
  {
    name: 'Comprehensive Lipid Profile',
    category: 'Biochemistry',
    code: 'LIP-01',
    description: 'Measures total cholesterol, HDL, LDL, VLDL, and triglycerides for cardiovascular health risk assessment.',
    price: 650,
    sampleType: 'Blood',
    fastingRequired: true,
    preparationInstructions: '10 to 12 hours of overnight fasting required before sample collection.',
    turnaroundHours: 24,
    dailyCapacity: 30,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['chest pain', 'palpitation', 'hypertension', 'heart', 'obesity']
  },
  {
    name: 'HbA1c (Glycosylated Hemoglobin)',
    category: 'Biochemistry',
    code: 'HBA1C-01',
    description: 'Reflects average blood glucose control over the past 2 to 3 months. Essential for diabetes management.',
    price: 500,
    sampleType: 'Blood',
    fastingRequired: false,
    preparationInstructions: 'Can be done at any time of day, fasting not mandatory.',
    turnaroundHours: 12,
    dailyCapacity: 35,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['diabetes', 'sugar', 'frequent urination', 'excessive thirst']
  },
  {
    name: 'Liver Function Test (LFT Profile)',
    category: 'Biochemistry',
    code: 'LFT-01',
    description: 'Measures Bilirubin (Total/Direct), SGOT (AST), SGPT (ALT), Alkaline Phosphatase, and Total Protein.',
    price: 700,
    sampleType: 'Blood',
    fastingRequired: true,
    preparationInstructions: '8 hours of fasting recommended.',
    turnaroundHours: 18,
    dailyCapacity: 25,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['jaundice', 'nausea', 'abdominal pain', 'alcohol screening']
  },
  {
    name: 'Renal / Kidney Function Test (KFT)',
    category: 'Biochemistry',
    code: 'KFT-01',
    description: 'Evaluates kidney performance via Blood Urea Nitrogen (BUN), Serum Creatinine, and Uric Acid.',
    price: 600,
    sampleType: 'Blood',
    fastingRequired: false,
    preparationInstructions: 'Stay adequately hydrated.',
    turnaroundHours: 12,
    dailyCapacity: 30,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['edema', 'swelling', 'flank pain', 'hypertension']
  },
  {
    name: 'Thyroid Stimulating Hormone (TSH) & Profile',
    category: 'Biochemistry',
    code: 'THY-01',
    description: 'Assesses thyroid gland function measuring T3, T4, and TSH hormones.',
    price: 550,
    sampleType: 'Blood',
    fastingRequired: true,
    preparationInstructions: 'Early morning sample preferred, prior to thyroid medications.',
    turnaroundHours: 24,
    dailyCapacity: 35,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['weight gain', 'fatigue', 'hair loss', 'cold intolerance']
  },
  {
    name: 'Digital Chest X-Ray (PA View)',
    category: 'Radiology',
    code: 'XRAY-01',
    description: 'Evaluates lungs, cardiac silhouette, mediastinum, pleura, and thoracic cage structure.',
    price: 400,
    sampleType: 'Digital Radiograph',
    fastingRequired: false,
    preparationInstructions: 'Remove upper body metallic accessories.',
    turnaroundHours: 4,
    dailyCapacity: 50,
    isHomeSampleAvailable: false,
    recommendedForSymptoms: ['cough', 'chest pain', 'breathlessness', 'fever', 'pneumonia']
  },
  {
    name: 'MRI Brain (Plain + Contrast)',
    category: 'Radiology',
    code: 'MRI-01',
    description: 'High-resolution magnetic resonance imaging of brain parenchyma, ventricles, and neurovasculature.',
    price: 6500,
    sampleType: 'Scan Imaging',
    fastingRequired: false,
    preparationInstructions: 'Remove all metallic objects, jewelry, and watches prior to scan.',
    turnaroundHours: 24,
    dailyCapacity: 10,
    isHomeSampleAvailable: false,
    recommendedForSymptoms: ['headache', 'dizziness', 'seizure', 'neurological deficit', 'stroke']
  },
  {
    name: '12-Lead Resting Electrocardiogram (ECG)',
    category: 'Cardiology',
    code: 'ECG-01',
    description: 'Records electrical activity of the heart to detect arrhythmias, ischemia, or prior myocardial infarction.',
    price: 300,
    sampleType: 'Electrical Trace',
    fastingRequired: false,
    preparationInstructions: 'Avoid heavy exertion 30 minutes prior to test.',
    turnaroundHours: 2,
    dailyCapacity: 60,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['chest pain', 'palpitation', 'shortness of breath', 'syncope']
  },
  {
    name: 'Urine Routine & Microscopic Examination',
    category: 'Pathology',
    code: 'URINE-01',
    description: 'Physical, chemical, and microscopic examination for renal health, infection, and glycosuria.',
    price: 250,
    sampleType: 'Urine',
    fastingRequired: false,
    preparationInstructions: 'Clean catch midstream morning urine sample.',
    turnaroundHours: 6,
    dailyCapacity: 50,
    isHomeSampleAvailable: true,
    recommendedForSymptoms: ['burning micturition', 'dysuria', 'frequent urination', 'back pain']
  }
];

// Sample test recommendation rules
const symptomTestRules = [
  { keywords: ['chest pain', 'heart', 'palpitation', 'breathless', 'hypertension'], tests: ['ECG-01', 'LIP-01', 'TROP-01'] },
  { keywords: ['fever', 'chills', 'fatigue', 'infection', 'weakness'], tests: ['CBC-01', 'CRP-01', 'TYP-01'] },
  { keywords: ['diabetes', 'sugar', 'frequent urination', 'thirst'], tests: ['HBA1C-01', 'GLU-01', 'LIP-01'] },
  { keywords: ['joint pain', 'back pain', 'bone', 'fracture', 'injury'], tests: ['XRAY-01', 'MRI-01', 'VITD-01'] },
  { keywords: ['jaundice', 'liver', 'abdominal pain', 'nausea'], tests: ['LFT-01', 'USG-01'] },
  { keywords: ['headache', 'migraine', 'dizziness', 'seizure'], tests: ['MRI-01', 'CBC-01'] }
];

// @desc Get all lab tests catalog with auto-seeding
// @route GET /api/lab/tests
exports.getLabTests = async (req, res, next) => {
  try {
    // Auto-seed catalog if database currently has 0 tests
    const existingCount = await LabTest.countDocuments();
    if (existingCount === 0) {
      try {
        await LabTest.insertMany(DEFAULT_LAB_TESTS);
        console.log('Auto-seeded default diagnostic lab tests catalog.');
      } catch (seedErr) {
        console.warn('Auto-seed lab tests notice:', seedErr.message);
      }
    }

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

// @desc Seed default lab tests on demand
// @route GET /api/lab/seed-tests
exports.seedDefaultTests = async (req, res, next) => {
  try {
    const existingCount = await LabTest.countDocuments();
    if (existingCount === 0) {
      await LabTest.insertMany(DEFAULT_LAB_TESTS);
    }
    const tests = await LabTest.find().sort({ category: 1, name: 1 });
    res.status(200).json({
      success: true,
      message: `Database has ${tests.length} diagnostic lab tests cataloged.`,
      count: tests.length,
      tests
    });
  } catch (error) {
    next(error);
  }
};

// Time helpers to prevent past booking and enforce only future timings
const getLocalDateString = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const isSlotInPast = (dateStr, slotTimeStr) => {
  const now = new Date();
  const todayStr = getLocalDateString(now);
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const [year, month, day] = dateStr.split('-').map(Number);
  const match = (slotTimeStr || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!match) return false;
  let [_, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period.toUpperCase() === 'PM' && hours < 12) hours += 12;
  if (period.toUpperCase() === 'AM' && hours === 12) hours = 0;
  
  // 15-minute grace period to prevent edge-case timing rejections
  const slotDate = new Date(year, month - 1, day, hours, minutes + 15, 0, 0);
  return slotDate <= now;
};

// @desc Book a lab test slot
// @route POST /api/lab/book
exports.bookLabTest = async (req, res, next) => {
  try {
    const {
      labTestId,
      testCode,
      testName: requestedTestName,
      bookingDate,
      slotTime,
      isHomeSampleCollection,
      collectionAddress,
      linkedAppointment,
      referringDoctor,
      priorityLevel,
      paymentStatus,
      patientId: customPatientId,
      patientName: customPatientName,
      patientPhone: customPatientPhone
    } = req.body;

    const patientId = customPatientId || req.user.id;
    const patientName = customPatientName || req.user.name || 'Patient';
    const patientPhone = customPatientPhone || req.user.phone || '';

    // Reject past date or past time slot bookings
    const todayStr = getLocalDateString();
    if (bookingDate < todayStr || isSlotInPast(bookingDate, slotTime)) {
      return res.status(400).json({
        success: false,
        message: 'Cannot book diagnostic lab tests for past dates or past time slots. Only future timings are available.'
      });
    }

    const mongoose = require('mongoose');
    let test = null;

    if (labTestId && mongoose.Types.ObjectId.isValid(labTestId)) {
      test = await LabTest.findById(labTestId);
    }
    if (!test && (testCode || requestedTestName)) {
      test = await LabTest.findOne({
        $or: [
          ...(testCode ? [{ code: testCode }] : []),
          ...(requestedTestName ? [{ name: requestedTestName }] : [])
        ]
      });
    }
    // If test is still not found in DB, auto-populate from default catalog
    if (!test) {
      const matchDefault = DEFAULT_LAB_TESTS.find(t => t.code === testCode || t.name === requestedTestName) || DEFAULT_LAB_TESTS[0];
      test = await LabTest.findOneAndUpdate(
        { code: matchDefault.code },
        matchDefault,
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    if (!test) {
      return res.status(404).json({ success: false, message: 'Lab test not found' });
    }

    // Check capacity for that day
    const existingBookingsCount = await LabBooking.countDocuments({
      labTest: test._id,
      bookingDate,
      status: { $ne: 'Cancelled' }
    });

    const capacity = test.dailyCapacity || 30;
    if (existingBookingsCount >= capacity) {
      return res.status(400).json({
        success: false,
        message: `Maximum daily capacity (${capacity} slots) reached for ${test.name} on ${bookingDate}. Please choose another date.`
      });
    }

    const homeCollectionFee = isHomeSampleCollection ? 150 : 0;
    const totalAmount = test.price + homeCollectionFee;

    const safeLinkedAppointment = (linkedAppointment && mongoose.Types.ObjectId.isValid(linkedAppointment))
      ? linkedAppointment
      : null;

    const labBooking = await LabBooking.create({
      patient: patientId,
      patientName,
      patientPhone,
      labTest: test._id,
      testName: test.name,
      bookingDate,
      slotTime: slotTime || '09:00 AM',
      isHomeSampleCollection: Boolean(isHomeSampleCollection),
      collectionAddress: collectionAddress || req.user.city || '',
      linkedAppointment: safeLinkedAppointment,
      referringDoctor: referringDoctor || 'Self / General OPD',
      totalAmount,
      paymentStatus: paymentStatus || 'Paid',
      priorityLevel: priorityLevel || 'Normal',
      status: 'Booked'
    });

    // Create confirmation notification for patient
    const patientNotif = await Notification.create({
      recipient: patientId,
      recipientRole: 'patient',
      title: 'Lab Test Booked Successfully',
      message: `Your booking for ${test.name} on ${bookingDate} at ${slotTime || '09:00 AM'} is confirmed. ${isHomeSampleCollection ? 'Home sample collection is scheduled.' : 'Please visit the diagnostic lab.'}`,
      type: 'general',
      priority: 'medium',
      metadata: { labBookingId: labBooking._id.toString() }
    });
    emitNotification(patientId, 'patient', patientNotif);

    // Notify Admin Operations Desk
    const adminNotif = await Notification.create({
      recipientRole: 'admin',
      title: 'New Diagnostic Lab Booking',
      message: `Patient ${patientName} booked ${test.name} for ${bookingDate} at ${slotTime || '09:00 AM'}.`,
      type: 'general',
      priority: 'low',
      metadata: { labBookingId: labBooking._id.toString() }
    });
    emitNotification(null, 'admin', adminNotif);

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

      // Create persistent in-app notification
      const reportNotif = await Notification.create({
        recipient: booking.patient,
        recipientRole: 'patient',
        title: 'Diagnostic Lab Report Ready',
        message: `Your test report for ${booking.testName} is now ready for review and download in your portal.`,
        type: 'lab_report_ready',
        priority: 'high',
        metadata: { labBookingId: booking._id.toString() }
      });
      emitNotification(booking.patient, 'patient', reportNotif);

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
