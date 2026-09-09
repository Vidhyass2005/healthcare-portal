const express = require('express');
const router = express.Router();
const {
  getAnalyticsSummary,
  getAllUsers,
  createDoctor,
  updateDoctor,
  deleteDoctor
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

router.get('/analytics', protect, authorize('admin'), getAnalyticsSummary);
router.get('/users', protect, authorize('admin'), getAllUsers);
router.post('/doctors', protect, authorize('admin'), createDoctor);
router.put('/doctors/:id', protect, authorize('admin'), updateDoctor);
router.delete('/doctors/:id', protect, authorize('admin'), deleteDoctor);

module.exports = router;
