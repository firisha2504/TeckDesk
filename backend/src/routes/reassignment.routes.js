import express from 'express';
import { reassignmentController } from '../controllers/reassignment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { rejectReassignmentRequestSchema } from '../validators/ticket.schema.js';

const router = express.Router();

router.use(authenticate, tenantScope);

// Manager / Admin list reassignment requests (pending and resolved history)
router.get('/', authorize('manager', 'admin', 'superadmin'), reassignmentController.listRequests);

// Cancel a pending request
router.post('/:id/cancel', reassignmentController.cancelRequest);
router.patch('/:id/cancel', reassignmentController.cancelRequest);

// Approve a pending reassignment request (manager/admin only)
router.post(
  '/:id/approve',
  authorize('manager', 'admin', 'superadmin'),
  reassignmentController.approveRequest
);
router.patch(
  '/:id/approve',
  authorize('manager', 'admin', 'superadmin'),
  reassignmentController.approveRequest
);

// Reject a pending reassignment request (manager/admin only with mandatory reason)
router.post(
  '/:id/reject',
  authorize('manager', 'admin', 'superadmin'),
  validateRequest(rejectReassignmentRequestSchema),
  reassignmentController.rejectRequest
);
router.patch(
  '/:id/reject',
  authorize('manager', 'admin', 'superadmin'),
  validateRequest(rejectReassignmentRequestSchema),
  reassignmentController.rejectRequest
);

export default router;
