const express = require('express');
const router = express.Router();
const {
  getMyNotifications,
  markAsRead,
  markAllRead
} = require('../controllers/notificationController');
const { protect } = require('../middleware/auth');

router.get('/', protect, getMyNotifications);
router.put('/:id/read', protect, markAsRead);
router.put('/read-all', protect, markAllRead);

module.exports = router;
