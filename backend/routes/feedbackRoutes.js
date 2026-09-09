const express = require('express');
const router = express.Router();
const { createFeedback, getMyFeedbacks, getAllFeedbacksAdmin, updateFeedbackStatus } = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, createFeedback);
router.get('/my', protect, getMyFeedbacks);
router.get('/admin', protect, authorize('admin'), getAllFeedbacksAdmin);
router.put('/:id', protect, authorize('admin'), updateFeedbackStatus);

module.exports = router;