import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { updateProfileSchema, updateUserRoleSchema } from '../validators/user.schema.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.get('/', userController.getUsers);
router.patch('/profile', validateRequest(updateProfileSchema), userController.updateProfile);
router.get('/:id', userController.getUserById);
router.patch('/:id/role', authorize('admin', 'manager'), validateRequest(updateUserRoleSchema), userController.updateUserRole);

export default router;
