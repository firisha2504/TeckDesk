import express from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
import { reassignmentController } from '../controllers/reassignment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { upload } from '../middleware/upload.js';
import {
  createTicketSchema,
  changeStatusSchema,
  reassignSchema,
  addCommentSchema,
  createReassignmentRequestSchema,
  rejectReassignmentRequestSchema,
} from '../validators/ticket.schema.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.post('/', validateRequest(createTicketSchema), ticketController.createTicket);
router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.patch('/:id/status', validateRequest(changeStatusSchema), ticketController.changeStatus);
router.patch(
  '/:id/reassign',
  authorize('manager', 'admin', 'superadmin'),
  validateRequest(reassignSchema),
  ticketController.reassignTicket
);

// Technician ticket reassignment request routes
router.post(
  '/:id/reassignment-request',
  authorize('technician', 'manager', 'admin'),
  validateRequest(createReassignmentRequestSchema),
  reassignmentController.createRequest
);
router.get('/:id/reassignment-requests', reassignmentController.getTicketRequests);
router.post(
  '/:id/reassignment-requests/:requestId/cancel',
  reassignmentController.cancelRequest
);
router.patch(
  '/:id/reassignment-requests/:requestId/cancel',
  reassignmentController.cancelRequest
);
router.post(
  '/:id/reassignment-requests/:requestId/approve',
  authorize('manager', 'admin', 'superadmin'),
  reassignmentController.approveRequest
);
router.patch(
  '/:id/reassignment-requests/:requestId/approve',
  authorize('manager', 'admin', 'superadmin'),
  reassignmentController.approveRequest
);
router.post(
  '/:id/reassignment-requests/:requestId/reject',
  authorize('manager', 'admin', 'superadmin'),
  validateRequest(rejectReassignmentRequestSchema),
  reassignmentController.rejectRequest
);
router.patch(
  '/:id/reassignment-requests/:requestId/reject',
  authorize('manager', 'admin', 'superadmin'),
  validateRequest(rejectReassignmentRequestSchema),
  reassignmentController.rejectRequest
);

router.post('/:id/comments', validateRequest(addCommentSchema), ticketController.addComment);
router.get('/:id/comments', ticketController.getTicketComments);
router.get('/:id/timeline', ticketController.getTicketTimeline);
router.get(
  '/:id/recommendations',
  authorize('manager', 'admin', 'technician'),
  ticketController.getRecommendedTechnicians
);
router.post('/:id/attachments', upload.single('file'), ticketController.uploadAttachment);

export default router;
