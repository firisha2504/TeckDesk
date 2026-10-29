import { notificationService } from '../services/notification.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const notificationController = {
  getNotifications: async (req, res, next) => {
    try {
      const { page, limit, unreadOnly } = req.query;
      const result = await notificationService.getUserNotifications(req.user._id, {
        page: page ? parseInt(page, 10) : 1,
        limit: limit ? parseInt(limit, 10) : 20,
        unreadOnly: unreadOnly === 'true',
      });
      res.status(200).json(
        ApiResponse.success(result.notifications, 'Notifications retrieved', {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          unreadCount: result.unreadCount,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  markAsRead: async (req, res, next) => {
    try {
      const notification = await notificationService.markAsRead(req.params.id, req.user._id);
      res.status(200).json(ApiResponse.success(notification, 'Notification marked as read'));
    } catch (error) {
      next(error);
    }
  },

  markAllAsRead: async (req, res, next) => {
    try {
      await notificationService.markAllAsRead(req.user._id);
      res.status(200).json(ApiResponse.success(null, 'All notifications marked as read'));
    } catch (error) {
      next(error);
    }
  },

  getUnreadCount: async (req, res, next) => {
    try {
      const count = await notificationService.getUnreadCount(req.user._id);
      res.status(200).json(ApiResponse.success({ unreadCount: count }));
    } catch (error) {
      next(error);
    }
  },
};
