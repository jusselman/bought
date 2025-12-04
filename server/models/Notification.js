import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema(
  {
    // User receiving the notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    // User who triggered the notification (if applicable)
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    senderName: {
      type: String,
      default: ""
    },
    senderPicturePath: {
      type: String,
      default: ""
    },
    // Notification type
    type: {
      type: String,
      enum: [
        'new_follower',        // Someone followed you
        'new_release',         // Brand you follow has new release
        'release_reminder',    // Release happening soon
        'post_like',          // Someone liked your post
        'post_comment',       // Someone commented on your post
        'comment_like',       // Someone liked your comment
        'comment_reply',      // Someone replied to your comment
        'mention'             // Someone mentioned you
      ],
      required: true,
      index: true
    },
    // Notification content
    title: {
      type: String,
      required: true,
      max: 100
    },
    message: {
      type: String,
      required: true,
      max: 300
    },
    // Related references
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      default: null
    },
    releaseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Release',
      default: null
    },
    brandId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null
    },
    commentId: {
      type: String, // Since comments are subdocuments
      default: null
    },
    // Notification status
    isRead: {
      type: Boolean,
      default: false,
      index: true
    },
    // Was push notification sent?
    pushSent: {
      type: Boolean,
      default: false
    },
    // Click action URL (deeplink for mobile)
    actionUrl: {
      type: String,
      default: ""
    }
  },
  { timestamps: true }
);

// Compound index for efficient querying of user's unread notifications
NotificationSchema.index({ recipientId: 1, isRead: 1, createdAt: -1 });

// Index for cleanup of old notifications
NotificationSchema.index({ createdAt: 1 });

// Static method to create notification
NotificationSchema.statics.createNotification = async function(data) {
  const notification = new this(data);
  await notification.save();
  return notification;
};

// Static method to mark as read
NotificationSchema.statics.markAsRead = async function(notificationId) {
  return await this.findByIdAndUpdate(
    notificationId,
    { isRead: true },
    { new: true }
  );
};

// Static method to mark all user notifications as read
NotificationSchema.statics.markAllAsRead = async function(userId) {
  return await this.updateMany(
    { recipientId: userId, isRead: false },
    { isRead: true }
  );
};

// Static method to get unread count
NotificationSchema.statics.getUnreadCount = async function(userId) {
  return await this.countDocuments({
    recipientId: userId,
    isRead: false
  });
};

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;