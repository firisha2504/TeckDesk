import { api } from './apiClient.js';

export const analyticsService = {
  getEmployeeMetrics: async () => {
    return api.get('/analytics/employee');
  },

  getTechnicianMetrics: async () => {
    return api.get('/analytics/technician');
  },

  getManagerMetrics: async (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return api.get(`/analytics/manager${query ? `?${query}` : ''}`);
  },

  getAdminMetrics: async () => {
    return api.get('/analytics/admin');
  },

  exportCSV: async (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    const blob = await api.get(`/analytics/export${query ? `?${query}` : ''}`);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `TechDesk-Report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },
};
