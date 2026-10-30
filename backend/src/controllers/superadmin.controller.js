import { superadminService } from '../services/superadmin.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const superadminController = {
  getOverview: async (req, res, next) => {
    try {
      const overview = await superadminService.getPlatformOverview();
      res.status(200).json(ApiResponse.success(overview, 'Platform overview metrics retrieved.'));
    } catch (error) {
      next(error);
    }
  },

  listOrganizations: async (req, res, next) => {
    try {
      const result = await superadminService.listOrganizations(req.query);
      res.status(200).json(
        ApiResponse.success(result, 'Organizations retrieved.', {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  getOrganizationDetails: async (req, res, next) => {
    try {
      const details = await superadminService.getOrganizationDetails(req.params.id);
      res.status(200).json(ApiResponse.success(details, 'Organization details retrieved.'));
    } catch (error) {
      next(error);
    }
  },

  getOrganizationStats: async (req, res, next) => {
    try {
      const stats = await superadminService.getOrganizationStats(req.params.id);
      res.status(200).json(ApiResponse.success(stats, 'Organization statistics retrieved.'));
    } catch (error) {
      next(error);
    }
  },

  approveOrganization: async (req, res, next) => {
    try {
      const organization = await superadminService.approveOrganization(req.params.id, req);
      res.status(200).json(
        ApiResponse.success(organization, `Organization '${organization.name}' has been approved and activated.`)
      );
    } catch (error) {
      next(error);
    }
  },

  rejectOrganization: async (req, res, next) => {
    try {
      const organization = await superadminService.rejectOrganization(
        req.params.id,
        req.body,
        req
      );
      res.status(200).json(
        ApiResponse.success(organization, `Organization '${organization.name}' registration has been rejected.`)
      );
    } catch (error) {
      next(error);
    }
  },

  suspendOrganization: async (req, res, next) => {
    try {
      const organization = await superadminService.suspendOrganization(
        req.params.id,
        req.body,
        req
      );
      res.status(200).json(
        ApiResponse.success(organization, `Organization '${organization.name}' has been suspended.`)
      );
    } catch (error) {
      next(error);
    }
  },

  reactivateOrganization: async (req, res, next) => {
    try {
      const organization = await superadminService.reactivateOrganization(req.params.id, req);
      res.status(200).json(
        ApiResponse.success(organization, `Organization '${organization.name}' has been reactivated.`)
      );
    } catch (error) {
      next(error);
    }
  },

  updateOrganization: async (req, res, next) => {
    try {
      const organization = await superadminService.updateOrganization(
        req.params.id,
        req.body,
        req
      );
      res.status(200).json(
        ApiResponse.success(organization, `Organization '${organization.name}' updated successfully.`)
      );
    } catch (error) {
      next(error);
    }
  },

  updateStatus: async (req, res, next) => {
    try {
      const organization = await superadminService.updateOrganizationStatus(
        req.params.id,
        req.body,
        req
      );
      res.status(200).json(
        ApiResponse.success(organization, `Organization status updated to '${organization.status}'.`)
      );
    } catch (error) {
      next(error);
    }
  },

  getOrganizationActivity: async (req, res, next) => {
    try {
      const result = await superadminService.getOrganizationActivity(req.params.id, req.query);
      res.status(200).json(
        ApiResponse.success(result, 'Organization activity retrieved.', {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  getAuditLogs: async (req, res, next) => {
    try {
      const result = await superadminService.getGlobalAuditLogs(req.query);
      res.status(200).json(
        ApiResponse.success(result, 'Global audit logs retrieved.', {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit,
        })
      );
    } catch (error) {
      next(error);
    }
  },
};
