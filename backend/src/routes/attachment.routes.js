import express from 'express';
import { attachmentController } from '../controllers/attachment.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { tenantScope } from '../middleware/tenantScope.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.get('/:id/download', attachmentController.downloadAttachment);
router.get('/:id', attachmentController.downloadAttachment);
router.delete('/:id', attachmentController.deleteAttachment);

export default router;
