import { api } from './apiClient.js';
import { downloadFile } from '../utils/downloadFile.js';

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
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });

    const queryString = query.toString();
    const endpoint = `/analytics/export${queryString ? `?${queryString}` : ''}`;

    // Request the CSV file as a Blob with proper responseType
    const fileData = await api.downloadBlob(endpoint);

    // Format download filename with current date stamp
    const dateStamp = new Date().toISOString().slice(0, 10);
    const filename = `TechDesk-Report-${dateStamp}.csv`;

    // Safely trigger download with URL revocation and validation
    downloadFile(fileData, filename, 'text/csv;charset=utf-8;');
  },
};

