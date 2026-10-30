import { api } from './apiClient.js';

export const superadminService = {
  /**
   * Get platform-wide overview metrics for Super Admin dashboard
   */
  getOverview: async () => {
    return api.get('/superadmin/overview');
  },

  /**
   * List organizations with pagination, search, status, and plan filters
   */
  listOrganizations: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return api.get(`/superadmin/organizations?${query.toString()}`);
  },

  /**
   * View detailed organization profile with users, tickets, teams, and SLAs
   */
  getOrganizationDetails: async (id) => {
    return api.get(`/superadmin/organizations/${id}`);
  },

  /**
   * View scoped organization performance statistics
   */
  getOrganizationStats: async (id) => {
    return api.get(`/superadmin/organizations/${id}/stats`);
  },

  /**
   * View organization-specific activity audit logs
   */
  getOrganizationActivity: async (id, params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return api.get(`/superadmin/organizations/${id}/activity?${query.toString()}`);
  },

  /**
   * Approve a pending organization registration
   */
  approveOrganization: async (id) => {
    return api.patch(`/superadmin/organizations/${id}/approve`);
  },

  /**
   * Reject an organization registration with a required reason
   */
  rejectOrganization: async (id, reason) => {
    return api.patch(`/superadmin/organizations/${id}/reject`, { reason });
  },

  /**
   * Suspend an organization with a reason
   */
  suspendOrganization: async (id, reason) => {
    return api.patch(`/superadmin/organizations/${id}/suspend`, { reason });
  },

  /**
   * Reactivate a suspended organization
   */
  reactivateOrganization: async (id) => {
    return api.patch(`/superadmin/organizations/${id}/reactivate`);
  },

  /**
   * Update organization information (name, domain, plan, settings)
   */
  updateOrganization: async (id, data) => {
    return api.patch(`/superadmin/organizations/${id}`, data);
  },

  /**
   * Retrieve platform-wide audit logs with filters
   */
  getAuditLogs: async (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, val);
      }
    });
    return api.get(`/superadmin/audit-logs?${query.toString()}`);
  },

  /**
   * Get system health and uptime
   */
  getSystemHealth: async () => {
    return api.get('/health');
  },
};
