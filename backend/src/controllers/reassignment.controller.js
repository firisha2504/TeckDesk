import { reassignmentService } from '../services/reassignment.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';

export const reassignmentController = {
  createRequest: async (req, res, next) => {
    try {
      const request = await reassignmentService.createRequest(
        req.params.id,
        req.body,
        req.user,
        req
      );
      res
        .status(201)
        .json(ApiResponse.created(request, 'Ticket reassignment request submitted successfully.'));
    } catch (error) {
      next(error);
    }
  },

  listRequests: async (req, res, next) => {
    try {
      const result = await reassignmentService.listRequests(req.query, req.user);
      res.status(200).json(
        ApiResponse.success(result, 'Reassignment requests retrieved successfully.', {
          total: result.total,
          page: result.page,
          totalPages: result.totalPages,
          limit: result.limit,
          pendingCount: result.pendingCount,
        })
      );
    } catch (error) {
      next(error);
    }
  },

  getTicketRequests: async (req, res, next) => {
    try {
      const requests = await reassignmentService.getTicketRequests(req.params.id, req.user);
      res
        .status(200)
        .json(ApiResponse.success(requests, 'Ticket reassignment history retrieved successfully.'));
    } catch (error) {
      next(error);
    }
  },

  cancelRequest: async (req, res, next) => {
    try {
      const requestId = req.params.requestId || req.params.id;
      const request = await reassignmentService.cancelRequest(requestId, req.user, req);
      res
        .status(200)
        .json(ApiResponse.success(request, 'Reassignment request cancelled successfully.'));
    } catch (error) {
      next(error);
    }
  },

  approveRequest: async (req, res, next) => {
    try {
      const requestId = req.params.requestId || req.params.id;
      const result = await reassignmentService.approveRequest(requestId, req.user, req);
      res
        .status(200)
        .json(ApiResponse.success(result, 'Ticket reassignment approved and updated successfully.'));
    } catch (error) {
      next(error);
    }
  },

  rejectRequest: async (req, res, next) => {
    try {
      const requestId = req.params.requestId || req.params.id;
      const result = await reassignmentService.rejectRequest(requestId, req.body, req.user, req);
      res
        .status(200)
        .json(ApiResponse.success(result, 'Ticket reassignment request rejected.'));
    } catch (error) {
      next(error);
    }
  },
};
