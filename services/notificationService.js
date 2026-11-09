const Notification = require('../models/Notification');
const User = require('../models/User');

class NotificationService {
  /**
   * Create a single targeted notification with duplicate prevention
   */
  static async createNotification({
    recipient,
    club = null,
    title,
    message,
    type = 'general',
    relatedId = null,
    relatedLink = '#'
  }) {
    try {
      if (!recipient) {
        // Broadcast
        return await this.broadcastToStudents({ club, title, message, type, relatedId, relatedLink });
      }

      // Duplicate prevention: Check if identical unread notification exists within last 2 hours
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
      const duplicateQuery = {
        recipient,
        type,
        title: title.trim(),
        createdAt: { $gte: twoHoursAgo }
      };

      if (relatedId) {
        duplicateQuery.relatedId = relatedId;
      }

      const existing = await Notification.findOne(duplicateQuery);
      if (existing) {
        // Return existing notification to prevent duplicate spamming
        return existing;
      }

      const notification = await Notification.create({
        recipient,
        club,
        title: title.trim(),
        message: message.trim(),
        type,
        relatedId,
        relatedLink,
        isRead: false,
        createdAt: new Date()
      });

      return notification;
    } catch (err) {
      console.error('[NotificationService] Error creating notification:', err);
      return null;
    }
  }

  /**
   * Broadcast a notification to all students with duplicate prevention
   */
  static async broadcastToStudents({
    club = null,
    title,
    message,
    type = 'general',
    relatedId = null,
    relatedLink = '#'
  }) {
    try {
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const duplicateQuery = {
        recipient: null,
        type,
        title: title.trim(),
        createdAt: { $gte: oneDayAgo }
      };

      if (relatedId) {
        duplicateQuery.relatedId = relatedId;
      }

      const existing = await Notification.findOne(duplicateQuery);
      if (existing) {
        return existing;
      }

      const notification = await Notification.create({
        recipient: null, // null indicates all students
        club,
        title: title.trim(),
        message: message.trim(),
        type,
        relatedId,
        relatedLink,
        isRead: false,
        readBy: [],
        createdAt: new Date()
      });

      return notification;
    } catch (err) {
      console.error('[NotificationService] Error broadcasting notification:', err);
      return null;
    }
  }

  /**
   * Notify all users with a specific role
   */
  static async notifyRole(role, payload) {
    try {
      const users = await User.find({ role }).select('_id');
      if (users.length === 0 && role === 'principal') {
        // Fallback to admin if principal account is not configured
        const adminUsers = await User.find({ role: 'admin' }).select('_id');
        for (const admin of adminUsers) {
          await this.createNotification({ ...payload, recipient: admin._id });
        }
        return;
      }

      for (const u of users) {
        await this.createNotification({ ...payload, recipient: u._id });
      }
    } catch (err) {
      console.error(`[NotificationService] Error notifying role ${role}:`, err);
    }
  }

  /**
   * Retrieve notifications for a given user based on role and read status
   */
  static async getNotificationsForUser(userId, role, { limit = 30, unreadOnly = false, type = null } = {}) {
    try {
      let query = {};

      if (role === 'student') {
        query.$or = [{ recipient: userId }, { recipient: null }];
      } else {
        query.recipient = userId;
      }

      if (type && type !== 'all') {
        query.type = type;
      }

      const rawNotifications = await Notification.find(query)
        .populate('club', 'name code logo')
        .sort({ createdAt: -1 })
        .limit(limit);

      const userIdStr = userId.toString();

      // Normalize isRead for broadcast notifications
      const notifications = rawNotifications.map(n => {
        const notifObj = n.toObject ? n.toObject() : { ...n };
        if (!notifObj.recipient) {
          // Broadcast to students
          const hasRead = (n.readBy || []).some(id => id && id.toString() === userIdStr);
          notifObj.isRead = hasRead;
        }
        notifObj.icon = this.getIconForType(notifObj.type);
        notifObj.timeAgo = this.formatTimeAgo(notifObj.createdAt);
        return notifObj;
      });

      if (unreadOnly) {
        return notifications.filter(n => !n.isRead);
      }

      return notifications;
    } catch (err) {
      console.error('[NotificationService] Error fetching notifications:', err);
      return [];
    }
  }

  /**
   * Get accurate unread count for a user
   */
  static async getUnreadCount(userId, role) {
    try {
      const userIdStr = userId.toString();
      if (role === 'student') {
        // Direct unread
        const directCount = await Notification.countDocuments({
          recipient: userId,
          isRead: false
        });
        // Broadcast unread
        const broadcastCount = await Notification.countDocuments({
          recipient: null,
          readBy: { $ne: userId }
        });
        return directCount + broadcastCount;
      } else {
        return await Notification.countDocuments({
          recipient: userId,
          isRead: false
        });
      }
    } catch (err) {
      console.error('[NotificationService] Error counting unread notifications:', err);
      return 0;
    }
  }

  /**
   * Mark a single notification as read
   */
  static async markAsRead(notificationId, userId) {
    try {
      const notif = await Notification.findById(notificationId);
      if (!notif) return false;

      if (!notif.recipient) {
        // Broadcast: add student to readBy array if not already present
        if (!notif.readBy.some(id => id.toString() === userId.toString())) {
          notif.readBy.push(userId);
          await notif.save();
        }
        return true;
      } else if (notif.recipient.toString() === userId.toString()) {
        notif.isRead = true;
        await notif.save();
        return true;
      }

      return false;
    } catch (err) {
      console.error('[NotificationService] Error marking as read:', err);
      return false;
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId, role) {
    try {
      // 1. Mark direct notifications as read
      await Notification.updateMany(
        { recipient: userId, isRead: false },
        { $set: { isRead: true } }
      );

      // 2. For students, add to readBy for all unread broadcasts
      if (role === 'student') {
        await Notification.updateMany(
          { recipient: null, readBy: { $ne: userId } },
          { $addToSet: { readBy: userId } }
        );
      }

      return true;
    } catch (err) {
      console.error('[NotificationService] Error marking all as read:', err);
      return false;
    }
  }

  /**
   * Get icon indicator for notification type
   */
  static getIconForType(type) {
    switch (type) {
      case 'recruitment':
        return '📢';
      case 'event':
        return '📅';
      case 'application':
        return '📝';
      case 'approval':
        return '⚖️';
      case 'admin':
        return '🛡️';
      default:
        return '🔔';
    }
  }

  /**
   * Helper to format relative time ago
   */
  static formatTimeAgo(date) {
    if (!date) return '';
    const diff = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(date).toLocaleDateString();
  }
}

module.exports = NotificationService;
