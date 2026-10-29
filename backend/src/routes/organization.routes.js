import express from 'express';
import { Organization } from '../models/Organization.js';
import { AuditLog } from '../models/AuditLog.js';
import { authenticate } from '../middleware/authenticate.js';
import { authorize } from '../middleware/authorize.js';
import { tenantScope } from '../middleware/tenantScope.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from '../services/audit.service.js';

const router = express.Router();

router.use(authenticate, tenantScope);

router.get('/settings', async (req, res, next) => {
  try {
    const org = await Organization.findById(req.organizationId);
    if (!org) throw ApiError.notFound('Organization not found');
    res.status(200).json(ApiResponse.success(org));
  } catch (error) {
    next(error);
  }
});

router.patch('/settings', authorize('admin'), async (req, res, next) => {
  try {
    const { name, domain, settings } = req.body;
    const org = await Organization.findById(req.organizationId);
    if (!org) throw ApiError.notFound('Organization not found');

    if (name) org.name = name;
    if (domain !== undefined) org.domain = domain;
    if (settings) {
      org.settings = {
        ...org.settings,
        ...settings,
      };
    }

    await org.save();

    await auditService.log({
      organization: org._id,
      actor: req.user._id,
      action: 'ORGANIZATION_SETTINGS_UPDATED',
      resource: 'Organization',
      resourceId: org._id,
      req,
    });

    res.status(200).json(ApiResponse.success(org, 'Organization settings updated successfully'));
  } catch (error) {
    next(error);
  }
});

router.get('/audit-logs', authorize('admin'), async (req, res, next) => {
  try {
    const { page = 1, limit = 25, action, resource } = req.query;
    const query = { organization: req.organizationId };

    if (action) query.action = action;
    if (resource) query.resource = resource;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    res.status(200).json(
      ApiResponse.success(logs, 'Audit logs retrieved', {
        total,
        page: parseInt(page, 10),
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      })
    );
  } catch (error) {
    next(error);
  }
});

export default router;
