import { analyticsService } from '../services/analytics.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const analyticsController = {
  getEmployeeDashboard: async (req, res, next) => {
    try {
      const data = await analyticsService.getEmployeeMetrics(req.user._id, req.organizationId);
      res.status(200).json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  },

  getTechnicianDashboard: async (req, res, next) => {
    try {
      const data = await analyticsService.getTechnicianMetrics(req.user._id, req.organizationId);
      res.status(200).json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  },

  getManagerDashboard: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      const data = await analyticsService.getManagerMetrics(req.organizationId, {
        startDate,
        endDate,
      });
      res.status(200).json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  },

  getAdminDashboard: async (req, res, next) => {
    try {
      const data = await analyticsService.getAdminMetrics(req.organizationId);
      res.status(200).json(ApiResponse.success(data));
    } catch (error) {
      next(error);
    }
  },

  exportCSV: async (req, res, next) => {
    try {
      const csv = await analyticsService.exportTicketsCSV(req.organizationId, req.query, req.user);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=techdesk-tickets-${Date.now()}.csv`
      );
      res.status(200).send(csv);
    } catch (error) {
      next(error);
    }
  },
};
