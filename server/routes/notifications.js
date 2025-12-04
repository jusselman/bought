import express from "express";
import {
  getUserNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  clearAllNotifications
} from "../controllers/notifications.js";
import { verifyToken, verifyOwnership } from "../middleware/auth.js";
import { validateObjectId } from "../middleware/validation.js";

const router = express.Router();

/* READ - Get user's notifications */
router.get(
  '/:userId',
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  getUserNotifications
);

/* READ - Get unread count */
router.get(
  '/:userId/unread/count',
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  getUnreadCount
);

/* PATCH - Mark notification as read */
router.patch(
  '/:notificationId/read',
  validateObjectId('notificationId'),
  verifyToken,
  markAsRead
);

/* PATCH - Mark all notifications as read */
router.patch(
  '/:userId/read-all',
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  markAllAsRead
);

/* DELETE - Delete single notification */
router.delete(
  '/:notificationId',
  validateObjectId('notificationId'),
  verifyToken,
  deleteNotification
);

/* DELETE - Clear all notifications */
router.delete(
  '/:userId/clear',
  validateObjectId('userId'),
  verifyToken,
  verifyOwnership('userId'),
  clearAllNotifications
);

export default router;