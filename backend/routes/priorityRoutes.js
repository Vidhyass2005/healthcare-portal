const express = require('express');
const router = express.Router();
const {
  calculateScorePreview,
  getDoctorQueue,
  emergencyOverride,
  getPatientQueueStatus
} = require('../controllers/priorityController');
const { protect, authorize } = require('../middleware/auth');

router.post('/calculate', calculateScorePreview);
router.get('/queue/:doctorId', getDoctorQueue);
router.post('/emergency-override/:appointmentId', protect, authorize('doctor', 'admin'), emergencyOverride);
router.get('/patient-status/:appointmentId', getPatientQueueStatus);

module.exports = router;
