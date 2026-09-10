const express = require('express');
const router = express.Router();
const {
  getLabTests,
  bookLabTest,
  getLabBookings,
  updateBookingStatus,
  recommendTests,
  createLabTest
} = require('../controllers/labController');
const { protect, authorize } = require('../middleware/auth');

router.get('/tests', getLabTests);
router.post('/tests', protect, authorize('admin'), createLabTest);
router.post('/book', protect, authorize('patient', 'donor'), bookLabTest);
router.get('/bookings', protect, getLabBookings);
router.put('/bookings/:id/status', protect, authorize('admin', 'doctor'), updateBookingStatus);
router.post('/recommend', recommendTests);

module.exports = router;
