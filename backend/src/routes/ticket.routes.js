import express from 'express';
import { ticketController } from '../controllers/ticket.controller.js';
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
} from '../validators/ticket.schema.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.post('/', validateRequest(createTicketSchema), ticketController.createTicket);
router.get('/', ticketController.listTickets);
router.get('/:id', ticketController.getTicketById);
router.patch('/:id/status', validateRequest(changeStatusSchema), ticketController.changeStatus);
router.patch(
  '/:id/reassign',
  authorize('manager', 'admin', 'technician'),
  validateRequest(reassignSchema),
  ticketController.reassignTicket
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
