import express from 'express';
import { slaController } from '../controllers/sla.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateSLAPolicySchema } from '../validators/user.schema.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.get('/', slaController.getPolicy);
router.patch('/', authorize('manager', 'admin'), validateRequest(updateSLAPolicySchema), slaController.updatePolicy);
router.post('/check', authorize('manager', 'admin'), slaController.triggerBreachCheck);

export default router;
