import express from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.get('/employee', analyticsController.getEmployeeDashboard);
router.get(
  '/technician',
  authorize('technician', 'manager', 'admin'),
  analyticsController.getTechnicianDashboard
);
router.get('/manager', authorize('manager', 'admin'), analyticsController.getManagerDashboard);
router.get('/admin', authorize('admin'), analyticsController.getAdminDashboard);
router.get('/export', authorize('manager', 'admin', 'technician'), analyticsController.exportCSV);

export default router;
