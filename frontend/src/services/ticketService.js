import { api } from './apiClient.js';

export const ticketService = {
  createTicket: async (ticketData) => {
    return api.post('/tickets', ticketData);
  },

  listTickets: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return api.get(`/tickets?${query.toString()}`);
  },

  getTicketById: async (id) => {
    return api.get(`/tickets/${id}`);
  },

  changeStatus: async (id, status, resolutionNotes = '') => {
    return api.patch(`/tickets/${id}/status`, { status, resolutionNotes });
  },

  reassignTicket: async (id, assigneeId) => {
    return api.patch(`/tickets/${id}/reassign`, { assigneeId });
  },

  addComment: async (id, content, isInternal = false) => {
    return api.post(`/tickets/${id}/comments`, { content, isInternal });
  },

  getTicketComments: async (id) => {
    return api.get(`/tickets/${id}/comments`);
  },

  getTicketTimeline: async (id) => {
    return api.get(`/tickets/${id}/timeline`);
  },

  getRecommendedTechnicians: async (id) => {
    return api.get(`/tickets/${id}/recommendations`);
  },

  uploadAttachment: async (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.upload(`/tickets/${id}/attachments`, formData);
  },
};
