const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Appointment = require('../models/Appointment');
const BloodDonor = require('../models/BloodDonor');
const BloodRequest = require('../models/BloodRequest');
const BloodInventory = require('../models/BloodInventory');
const LabTest = require('../models/LabTest');
const LabBooking = require('../models/LabBooking');
const Notification = require('../models/Notification');
const { calculatePriorityScore, reorderDoctorQueue } = require('../services/priorityEngine');

dotenv.config();

const seedDatabase = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/healthcare_portal';
    await mongoose.connect(mongoUri);
    console.log('MongoDB Connected for Seeding...');

    // Clear existing collections
    await User.deleteMany();
    await Appointment.deleteMany();
    await BloodDonor.deleteMany();
    await BloodRequest.deleteMany();
    await BloodInventory.deleteMany();
    await LabTest.deleteMany();
    await LabBooking.deleteMany();
    await Notification.deleteMany();
    console.log('Cleared existing database records.');

    // 1. Create Admin
    const admin = await User.create({
      name: 'Dr. Arthur Campbell (Chief Admin)',
      email: 'admin@hospital.com',
      password: 'Admin@123',
      role: 'admin',
      phone: '+91 98401 11222',
      age: 48,
      gender: 'Male',
      city: 'Chennai'
    });

    // 2. Create Doctors
    const doctorsData = [
      {
        name: 'Dr. Priya Sharma',
        email: 'priya.cardio@hospital.com',
        password: 'Doctor@123',
        role: 'doctor',
        phone: '+91 98402 33445',
        age: 42,
        gender: 'Female',
        city: 'Chennai',
        doctorProfile: {
          department: 'Cardiology',
          specialization: 'Senior Interventional Cardiologist',
          experienceYears: 14,
          consultationFee: 800,
          roomNumber: 'OPD-Cardio-102',
          availabilityStatus: 'Available',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
          slotTimes: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM']
        }
      },
      {
        name: 'Dr. Rajesh Kumar',
        email: 'rajesh.ortho@hospital.com',
        password: 'Doctor@123',
        role: 'doctor',
        phone: '+91 98403 44556',
        age: 46,
        gender: 'Male',
        city: 'Chennai',
        doctorProfile: {
          department: 'Orthopedics',
          specialization: 'Joint Replacement & Spine Surgeon',
          experienceYears: 18,
          consultationFee: 750,
          roomNumber: 'OPD-Ortho-105',
          availabilityStatus: 'Available',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Saturday'],
          slotTimes: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM']
        }
      },
      {
        name: 'Dr. Ananya Sen',
        email: 'ananya.neuro@hospital.com',
        password: 'Doctor@123',
        role: 'doctor',
        phone: '+91 98404 55667',
        age: 39,
        gender: 'Female',
        city: 'Chennai',
        doctorProfile: {
          department: 'Neurology',
          specialization: 'Consultant Neurologist & Stroke Specialist',
          experienceYears: 11,
          consultationFee: 900,
          roomNumber: 'OPD-Neuro-201',
          availabilityStatus: 'Available',
          availableDays: ['Monday', 'Wednesday', 'Thursday', 'Friday'],
          slotTimes: ['09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:30 PM', '03:00 PM', '03:30 PM']
        }
      },
      {
        name: 'Dr. Senthil Nathan',
        email: 'senthil.med@hospital.com',
        password: 'Doctor@123',
        role: 'doctor',
        phone: '+91 98405 66778',
        age: 50,
        gender: 'Male',
        city: 'Chennai',
        doctorProfile: {
          department: 'General Medicine',
          specialization: 'Internal Medicine & Diabetologist',
          experienceYears: 22,
          consultationFee: 500,
          roomNumber: 'OPD-GenMed-101',
          availabilityStatus: 'Available',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
          slotTimes: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM']
        }
      },
      {
        name: 'Dr. Vivek Menon',
        email: 'vivek.pedia@hospital.com',
        password: 'Doctor@123',
        role: 'doctor',
        phone: '+91 98406 77889',
        age: 37,
        gender: 'Male',
        city: 'Chennai',
        doctorProfile: {
          department: 'Pediatrics',
          specialization: 'Consultant Pediatrician',
          experienceYears: 9,
          consultationFee: 600,
          roomNumber: 'OPD-Pedia-108',
          availabilityStatus: 'Available',
          availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Friday', 'Saturday'],
          slotTimes: ['09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '02:00 PM', '02:30 PM']
        }
      }
    ];

    const createdDoctors = [];
    for (const doc of doctorsData) {
      const created = await User.create(doc);
      createdDoctors.push(created);
    }
    console.log(`Created ${createdDoctors.length} Doctors.`);

    // 3. Create Patients
    const patientsData = [
      {
        name: 'Ramesh Kumar',
        email: 'ramesh@gmail.com',
        password: 'Patient@123',
        role: 'patient',
        phone: '+91 97890 12345',
        age: 68,
        gender: 'Male',
        bloodGroup: 'O+',
        city: 'Chennai',
        hasChronicCondition: true,
        chronicDiseases: ['Type 2 Diabetes', 'Hypertension']
      },
      {
        name: 'Priya Sundar',
        email: 'priya@gmail.com',
        password: 'Patient@123',
        role: 'patient',
        phone: '+91 97890 23456',
        age: 26,
        gender: 'Female',
        bloodGroup: 'B+',
        city: 'Chennai',
        hasChronicCondition: false,
        chronicDiseases: []
      },
      {
        name: 'Venkatesh R',
        email: 'venkat@gmail.com',
        password: 'Patient@123',
        role: 'patient',
        phone: '+91 97890 34567',
        age: 54,
        gender: 'Male',
        bloodGroup: 'A+',
        city: 'Chennai',
        hasChronicCondition: true,
        chronicDiseases: ['Coronary Artery Disease']
      },
      {
        name: 'Meenakshi Ammal',
        email: 'meenakshi@gmail.com',
        password: 'Patient@123',
        role: 'patient',
        phone: '+91 97890 45678',
        age: 72,
        gender: 'Female',
        bloodGroup: 'AB+',
        city: 'Chennai',
        hasChronicCondition: true,
        chronicDiseases: ['Asthma', 'Hypertension']
      }
    ];

    const createdPatients = [];
    for (const pat of patientsData) {
      const created = await User.create(pat);
      createdPatients.push(created);
    }
    console.log(`Created ${createdPatients.length} Patients.`);

    // 4. Create Blood Donors
    const donorsData = [
      {
        name: 'Anand V (Active Donor)',
        email: 'anand.donor@gmail.com',
        password: 'Donor@123',
        role: 'donor',
        phone: '+91 98840 55443',
        age: 29,
        gender: 'Male',
        bloodGroup: 'O-',
        city: 'Chennai',
        donorProfile: {
          lastDonationDate: new Date(Date.now() - 120 * 24 * 60 * 60 * 1000), // 120 days ago (Eligible)
          totalDonations: 6,
          weightKg: 72,
          isAvailableForEmergency: true
        }
      },
      {
        name: 'Deepa Krishnan',
        email: 'deepa.donor@gmail.com',
        password: 'Donor@123',
        role: 'donor',
        phone: '+91 98840 66554',
        age: 32,
        gender: 'Female',
        bloodGroup: 'A+',
        city: 'Chennai',
        donorProfile: {
          lastDonationDate: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000), // 45 days ago (Ineligible, needs 90 days)
          totalDonations: 3,
          weightKg: 58,
          isAvailableForEmergency: true
        }
      },
      {
        name: 'Karthik Raja',
        email: 'karthik.donor@gmail.com',
        password: 'Donor@123',
        role: 'donor',
        phone: '+91 98840 77665',
        age: 25,
        gender: 'Male',
        bloodGroup: 'B+',
        city: 'Chennai',
        donorProfile: {
          lastDonationDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000), // 180 days ago (Eligible)
          totalDonations: 4,
          weightKg: 68,
          isAvailableForEmergency: true
        }
      },
      {
        name: 'Divya Bharathi',
        email: 'divya.donor@gmail.com',
        password: 'Donor@123',
        role: 'donor',
        phone: '+91 98840 88776',
        age: 35,
        gender: 'Female',
        bloodGroup: 'AB-',
        city: 'Chennai',
        donorProfile: {
          lastDonationDate: null, // First time donor
          totalDonations: 0,
          weightKg: 62,
          isAvailableForEmergency: true
        }
      }
    ];

    const createdDonors = [];
    for (const don of donorsData) {
      const user = await User.create(don);
      const isEligible = !don.donorProfile.lastDonationDate ||
        (Date.now() - new Date(don.donorProfile.lastDonationDate).getTime()) >= (90 * 24 * 60 * 60 * 1000);

      const bDonor = await BloodDonor.create({
        user: user._id,
        name: user.name,
        bloodGroup: user.bloodGroup,
        phone: user.phone,
        city: user.city,
        age: user.age,
        weightKg: don.donorProfile.weightKg,
        lastDonationDate: don.donorProfile.lastDonationDate,
        isEligible,
        availableForEmergency: true,
        donationHistory: don.donorProfile.totalDonations > 0 ? [
          {
            donationDate: don.donorProfile.lastDonationDate,
            units: 1,
            hospitalName: 'MEDCARE HOSPITAL Chennai',
            certificateId: `BLD-CERT-${Math.floor(100000 + Math.random() * 900000)}`
          }
        ] : []
      });
      createdDonors.push(bDonor);
    }
    console.log(`Created ${createdDonors.length} Blood Donors.`);

    // 5. Initialize Blood Inventory
    const initialBloodInventory = [
      { bloodGroup: 'A+', unitsAvailable: 14, criticalThreshold: 5 },
      { bloodGroup: 'A-', unitsAvailable: 6, criticalThreshold: 4 },
      { bloodGroup: 'B+', unitsAvailable: 18, criticalThreshold: 6 },
      { bloodGroup: 'B-', unitsAvailable: 4, criticalThreshold: 4 },
      { bloodGroup: 'AB+', unitsAvailable: 9, criticalThreshold: 3 },
      { bloodGroup: 'AB-', unitsAvailable: 2, criticalThreshold: 3 }, // Critical Alert
      { bloodGroup: 'O+', unitsAvailable: 22, criticalThreshold: 8 },
      { bloodGroup: 'O-', unitsAvailable: 3, criticalThreshold: 5 }  // Critical Alert
    ];
    await BloodInventory.insertMany(initialBloodInventory);
    console.log('Blood Inventory initialized.');

    // 6. Create Lab Tests Catalog
    const labTestsData = [
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
        name: 'Digital Chest X-Ray (PA View)',
        category: 'Radiology',
        code: 'XRAY-01',
        description: 'Evaluates lungs, cardiac silhouette, mediastinum, pleura, and thoracic cage structure.',
        price: 400,
        sampleType: 'Digital Radiograph',
        fastingRequired: false,
        turnaroundHours: 4,
        dailyCapacity: 50,
        isHomeSampleAvailable: false,
        recommendedForSymptoms: ['cough', 'chest pain', 'breathlessness', 'fever', 'pneumonia']
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
        name: '12-Lead Resting Electrocardiogram (ECG)',
        category: 'Cardiology',
        code: 'ECG-01',
        description: 'Records electrical activity of the heart to detect arrhythmias, ischemia, or prior myocardial infarction.',
        price: 300,
        sampleType: 'Electrical Trace',
        fastingRequired: false,
        turnaroundHours: 2,
        dailyCapacity: 60,
        isHomeSampleAvailable: true,
        recommendedForSymptoms: ['chest pain', 'palpitation', 'shortness of breath', 'syncope']
      }
    ];

    const createdLabTests = await LabTest.insertMany(labTestsData);
    console.log(`Created ${createdLabTests.length} Lab Tests.`);

    // 7. Create Sample Appointments with Clinical Priority Scoring
    const today = new Date().toISOString().split('T')[0];
    const docPriya = createdDoctors[0]; // Cardiologist
    const docSenthil = createdDoctors[3]; // General Medicine

    // Patient 1: Meenakshi (72 yrs, Severe Cardiac, Emergency Override) -> High Priority (Score 100+)
    const { priorityScore: pScore1, priorityLevel: pLevel1 } = calculatePriorityScore({
      severity: 'Severe',
      age: 72,
      hasChronicCondition: true,
      isEmergency: true
    });
    const appt1 = await Appointment.create({
      patient: createdPatients[3]._id,
      patientName: createdPatients[3].name,
      patientAge: 72,
      patientGender: 'Female',
      doctor: docPriya._id,
      doctorName: docPriya.name,
      department: 'Cardiology',
      appointmentDate: today,
      slotTime: '09:00 AM',
      symptoms: 'Acute radiating chest pain, severe shortness of breath and diaphoresis',
      severity: 'Severe',
      hasChronicCondition: true,
      chronicDiseases: ['Asthma', 'Hypertension'],
      isEmergency: true,
      priorityScore: pScore1,
      priorityLevel: pLevel1,
      status: 'Confirmed'
    });

    // Patient 2: Ramesh Kumar (68 yrs, Moderate chest pain + Diabetes) -> High Priority (Score: 2*5 + 3*2 + 2*3 = 22)
    const { priorityScore: pScore2, priorityLevel: pLevel2 } = calculatePriorityScore({
      severity: 'Moderate',
      age: 68,
      hasChronicCondition: true,
      isEmergency: false
    });
    const appt2 = await Appointment.create({
      patient: createdPatients[0]._id,
      patientName: createdPatients[0].name,
      patientAge: 68,
      patientGender: 'Male',
      doctor: docPriya._id,
      doctorName: docPriya.name,
      department: 'Cardiology',
      appointmentDate: today,
      slotTime: '09:30 AM',
      symptoms: 'Exertional angina, irregular heartbeats on climbing stairs',
      severity: 'Moderate',
      hasChronicCondition: true,
      chronicDiseases: ['Type 2 Diabetes', 'Hypertension'],
      isEmergency: false,
      priorityScore: pScore2,
      priorityLevel: pLevel2,
      status: 'Confirmed'
    });

    // Patient 3: Venkatesh (54 yrs, Mild fatigue) -> Moderate Priority (Score: 1*5 + 2*2 + 2*3 = 15)
    const { priorityScore: pScore3, priorityLevel: pLevel3 } = calculatePriorityScore({
      severity: 'Mild',
      age: 54,
      hasChronicCondition: true,
      isEmergency: false
    });
    const appt3 = await Appointment.create({
      patient: createdPatients[2]._id,
      patientName: createdPatients[2].name,
      patientAge: 54,
      patientGender: 'Male',
      doctor: docPriya._id,
      doctorName: docPriya.name,
      department: 'Cardiology',
      appointmentDate: today,
      slotTime: '10:00 AM',
      symptoms: 'Routine cardiovascular follow-up checkup',
      severity: 'Mild',
      hasChronicCondition: true,
      chronicDiseases: ['Coronary Artery Disease'],
      isEmergency: false,
      priorityScore: pScore3,
      priorityLevel: pLevel3,
      status: 'Confirmed'
    });

    // Patient 4: Priya Sundar (26 yrs, Mild fever) -> Low Priority (Score: 1*5 + 1*2 + 0 = 7)
    const { priorityScore: pScore4, priorityLevel: pLevel4 } = calculatePriorityScore({
      severity: 'Mild',
      age: 26,
      hasChronicCondition: false,
      isEmergency: false
    });
    const appt4 = await Appointment.create({
      patient: createdPatients[1]._id,
      patientName: createdPatients[1].name,
      patientAge: 26,
      patientGender: 'Female',
      doctor: docSenthil._id,
      doctorName: docSenthil.name,
      department: 'General Medicine',
      appointmentDate: today,
      slotTime: '09:00 AM',
      symptoms: 'Mild intermittent seasonal fever and sore throat',
      severity: 'Mild',
      hasChronicCondition: false,
      chronicDiseases: [],
      isEmergency: false,
      priorityScore: pScore4,
      priorityLevel: pLevel4,
      status: 'Confirmed'
    });

    // Re-order queues for doctors
    await reorderDoctorQueue(docPriya._id, today);
    await reorderDoctorQueue(docSenthil._id, today);
    console.log('Appointments and priority sorted queue created.');

    // 8. Create Sample Lab Booking with Report
    const cbcTest = createdLabTests[0];
    const lipidTest = createdLabTests[1];

    await LabBooking.create({
      patient: createdPatients[0]._id,
      patientName: createdPatients[0].name,
      patientPhone: createdPatients[0].phone,
      labTest: cbcTest._id,
      testName: cbcTest.name,
      bookingDate: today,
      slotTime: '08:30 AM',
      isHomeSampleCollection: true,
      collectionAddress: 'No. 42, Greenways Road, RA Puram, Chennai',
      linkedAppointment: appt2._id,
      referringDoctor: docPriya.name,
      totalAmount: cbcTest.price + 150,
      paymentStatus: 'Paid',
      priorityLevel: 'Normal',
      status: 'Report Ready',
      reportData: {
        generatedDate: new Date(),
        reportSummary: 'All investigated cellular parameters are within standard adult physiological limits.',
        findings: [
          { parameter: 'Hemoglobin (Hb)', result: '13.8', referenceRange: '13.0 - 17.0', unit: 'g/dL', isAbnormal: false },
          { parameter: 'Total Leukocyte Count (WBC)', result: '6,800', referenceRange: '4,000 - 11,000', unit: 'cells/cu.mm', isAbnormal: false },
          { parameter: 'Platelet Count', result: '220,000', referenceRange: '150,000 - 450,000', unit: '/mcL', isAbnormal: false },
          { parameter: 'ESR (1st Hour)', result: '12', referenceRange: '0 - 15', unit: 'mm/hr', isAbnormal: false }
        ],
        doctorRemarks: 'Normal hematology profile. Continue prescribed diabetic medications.',
        pdfUrl: `/api/lab/reports/sample/download`
      }
    });

    // 9. Create Sample Emergency Blood Request
    await BloodRequest.create({
      requester: docPriya._id,
      requesterName: docPriya.name,
      requesterRole: 'doctor',
      patientName: 'Emergency Cardiac ICU Patient',
      bloodGroup: 'O-',
      unitsRequired: 2,
      hospitalName: 'MEDCARE HOSPITAL (Cardio ICU)',
      city: 'Chennai',
      urgencyLevel: 'Critical / Immediate',
      reason: 'Urgent Coronary Bypass Grafting (CABG) requirement',
      isEmergencyAlertSent: true,
      status: 'Broadcasted'
    });

    console.log('Sample Data Seeded Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Database Seeding Failed:', error);
    process.exit(1);
  }
};

seedDatabase();
