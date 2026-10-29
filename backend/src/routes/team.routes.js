import express from 'express';
import { teamController } from '../controllers/team.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { createTeamSchema } from '../validators/user.schema.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.get('/', teamController.getTeams);
router.post('/', authorize('manager', 'admin'), validateRequest(createTeamSchema), teamController.createTeam);
router.patch('/:id', authorize('manager', 'admin'), teamController.updateTeam);
router.delete('/:id', authorize('manager', 'admin'), teamController.deleteTeam);

export default router;
