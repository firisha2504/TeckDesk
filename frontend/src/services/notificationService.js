import { api } from './apiClient.js';

export const notificationService = {
  getNotifications: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/notifications${query ? `?${query}` : ''}`);
  },

  getUnreadCount: async () => {
    return api.get('/notifications/unread-count');
  },

  markAsRead: async (id) => {
    return api.patch(`/notifications/${id}/read`);
  },

  markAllAsRead: async () => {
    return api.post('/notifications/read-all');
  },
};
