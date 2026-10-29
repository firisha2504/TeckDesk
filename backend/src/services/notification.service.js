import { Notification } from '../models/Notification.js';
import { socketEmitter } from '../sockets/socketServer.js';
import { logger } from '../utils/logger.js';

export const notificationService = {
  createNotification: async ({
    recipient,
    organization,
    title,
    message,
    type = 'SYSTEM',
    ticket = null,
  }) => {
    try {
      const recipientId = recipient?._id || recipient;
      const organizationId = organization?._id || organization;
      const ticketId = ticket?._id || ticket || null;

      const notification = await Notification.create({
        recipient: recipientId,
        organization: organizationId,
        title,
        message,
        type,
        ticket: ticketId,
        isRead: false,
      });

      // Emit real-time notification to user's room
      socketEmitter.emitToUser(recipientId.toString(), 'notification:new', notification);

      return notification;
    } catch (error) {
      logger.error('Failed to create notification:', error);
      return null;
    }
  },

  getUserNotifications: async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
    const query = { recipient: userId };
    if (unreadOnly) {
      query.isRead = false;
    }

    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('ticket', 'ticketNumber title priority status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return {
      notifications,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      unreadCount,
    };
  },

  markAsRead: async (notificationId, userId) => {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, recipient: userId },
      { isRead: true, readAt: new Date() },
      { new: true }
    );
    return notification;
  },

  markAllAsRead: async (userId) => {
    const result = await Notification.updateMany(
      { recipient: userId, isRead: false },
      { isRead: true, readAt: new Date() }
    );
    return result;
  },

  getUnreadCount: async (userId) => {
    return Notification.countDocuments({ recipient: userId, isRead: false });
  },
};
