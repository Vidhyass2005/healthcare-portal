const Notification = require('../models/Notification');

// @desc Get notifications for user or general/role broadcasts
// @route GET /api/notifications
exports.getMyNotifications = async (req, res, next) => {
  try {
    const userId = req.user ? req.user.id : null;
    const userRole = req.user ? req.user.role : 'patient';

    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { recipientRole: userRole },
        { recipientRole: 'all' }
      ]
    }).sort({ createdAt: -1 }).limit(30);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark notification as read
// @route PUT /api/notifications/:id/read
exports.markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );

    res.status(200).json({
      success: true,
      notification
    });
  } catch (error) {
    next(error);
  }
};

// @desc Mark all notifications as read
// @route PUT /api/notifications/read-all
exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    await Notification.updateMany(
      {
        $or: [
          { recipient: userId },
          { recipientRole: userRole },
          { recipientRole: 'all' }
        ]
      },
      { isRead: true }
    );

    res.status(200).json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    next(error);
  }
};
