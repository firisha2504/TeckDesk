import { api } from './apiClient.js';

export const authService = {
  login: async (credentials) => {
    const data = await api.post('/auth/login', credentials);
    if (data?.token) {
      localStorage.setItem('techdesk_token', data.token);
    }
    return data;
  },

  register: async (userData) => {
    const data = await api.post('/auth/register', userData);
    if (data?.token) {
      localStorage.setItem('techdesk_token', data.token);
    }
    return data;
  },

  registerOrganization: async (orgData) => {
    return api.post('/auth/register-organization', orgData);
  },

  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      localStorage.removeItem('techdesk_token');
    }
  },

  getCurrentUser: async () => {
    return api.get('/auth/me');
  },

  forgotPassword: async (email) => {
    return api.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token, password) => {
    return api.post('/auth/reset-password', { token, password });
  },

  updateProfile: async (profileData) => {
    return api.patch('/users/profile', profileData);
  },
};
