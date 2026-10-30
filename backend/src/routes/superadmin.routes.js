import express from 'express';
import { superadminController } from '../controllers/superadmin.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  updateOrganizationStatusSchema,
  rejectOrganizationSchema,
  suspendOrganizationSchema,
  updateOrganizationSchema,
} from '../validators/superadmin.schema.js';

const router = express.Router();

// All superadmin routes strictly require authentication and 'superadmin' role
router.use(authenticate, authorize('superadmin'));

// Platform Overview & Global Metrics
router.get('/overview', superadminController.getOverview);

// Organization Management
router.get('/organizations', superadminController.listOrganizations);
router.get('/organizations/:id', superadminController.getOrganizationDetails);
router.get('/organizations/:id/stats', superadminController.getOrganizationStats);
router.get('/organizations/:id/activity', superadminController.getOrganizationActivity);

// Organization Lifecycle State Transitions
router.patch('/organizations/:id/approve', superadminController.approveOrganization);
router.patch(
  '/organizations/:id/reject',
  validateRequest(rejectOrganizationSchema),
  superadminController.rejectOrganization
);
router.patch(
  '/organizations/:id/suspend',
  validateRequest(suspendOrganizationSchema),
  superadminController.suspendOrganization
);
router.patch('/organizations/:id/reactivate', superadminController.reactivateOrganization);
router.patch(
  '/organizations/:id/status',
  validateRequest(updateOrganizationStatusSchema),
  superadminController.updateStatus
);
router.patch(
  '/organizations/:id',
  validateRequest(updateOrganizationSchema),
  superadminController.updateOrganization
);
router.put(
  '/organizations/:id',
  validateRequest(updateOrganizationSchema),
  superadminController.updateOrganization
);

// Platform-Wide Audit Logs
router.get('/audit-logs', superadminController.getAuditLogs);

export default router;
