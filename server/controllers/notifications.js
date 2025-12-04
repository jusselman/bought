import Notification from "../models/Notification.js";
import User from "../models/User.js";

/* READ - Get User Notifications */
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;
    const skip = (page - 1) * limit;

    let query = { recipientId: userId };
    
    // Filter for unread only if requested
    if (unreadOnly === 'true') {
      query.isRead = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('senderId', 'userName picturePath')
      .populate('postId', 'description imagePath')
      .populate('releaseId', 'name images')
      .populate('brandId', 'name logoPath');

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      notifications,
      unreadCount,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* READ - Get Unread Count */
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;

    const unreadCount = await Notification.getUnreadCount(userId);

    res.status(200).json({
      success: true,
      unreadCount
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Mark Notification as Read */
export const markAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.markAsRead(notificationId);

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Notification not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification marked as read",
      notification
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* UPDATE - Mark All Notifications as Read */
export const markAllAsRead = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.markAllAsRead(userId);

    res.status(200).json({
      success: true,
      message: "All notifications marked as read"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* DELETE - Delete Notification */
export const deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findByIdAndDelete(notificationId);

    if (!notification) {
      return res.status(404).json({ 
        success: false,
        message: "Notification not found" 
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification deleted successfully"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};

/* DELETE - Clear All Notifications */
export const clearAllNotifications = async (req, res) => {
  try {
    const { userId } = req.params;

    await Notification.deleteMany({ recipientId: userId });

    res.status(200).json({
      success: true,
      message: "All notifications cleared"
    });
  } catch (err) {
    res.status(500).json({ 
      success: false,
      message: err.message 
    });
  }
};