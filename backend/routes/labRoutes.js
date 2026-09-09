const express = require('express');
const router = express.Router();
const {
  getLabTests,
  bookLabTest,
  getLabBookings,
  updateBookingStatus,
  recommendTests
} = require('../controllers/labController');
const { protect, authorize } = require('../middleware/auth');

router.get('/tests', getLabTests);
router.post('/book', protect, bookLabTest);
router.get('/bookings', protect, getLabBookings);
router.put('/bookings/:id/status', protect, authorize('admin', 'doctor'), updateBookingStatus);
router.post('/recommend', recommendTests);

module.exports = router;
