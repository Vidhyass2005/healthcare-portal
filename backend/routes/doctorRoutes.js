const express = require('express');
const router = express.Router();
const {
  getDoctorDashboardSummary,
  updateAvailability,
  getPatientHistory,
  requestEmergencyBlood
} = require('../controllers/doctorController');
const { protect, authorize } = require('../middleware/auth');

router.get('/dashboard', protect, authorize('doctor'), getDoctorDashboardSummary);
router.put('/availability', protect, authorize('doctor'), updateAvailability);
router.get('/patient-history/:patientId', protect, authorize('doctor', 'admin'), getPatientHistory);
router.post('/emergency-blood-request', protect, authorize('doctor'), requestEmergencyBlood);

module.exports = router;
