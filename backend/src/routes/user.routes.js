import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { handleAvatarUpload } from '../middleware/upload.js';
import { updateProfileSchema, updateUserRoleSchema } from '../validators/user.schema.js';

const router = express.Router();

// Public avatar image serving fallback with strict path isolation
router.get('/avatar/:filename', userController.getAvatar);

// Authenticated & organization-scoped user operations
router.use(authenticate, tenantScope);

router.get('/', userController.getUsers);
router.patch('/profile', validateRequest(updateProfileSchema), userController.updateProfile);

// Authenticated user avatar management (operates strictly on req.user._id)
router.post('/avatar', handleAvatarUpload, userController.uploadAvatar);
router.delete('/avatar', userController.removeAvatar);

router.get('/:id', userController.getUserById);
router.patch('/:id/role', authorize('admin', 'manager'), validateRequest(updateUserRoleSchema), userController.updateUserRole);

export default router;

