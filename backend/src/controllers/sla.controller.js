import { SLAPolicy } from '../models/SLAPolicy.js';
import { slaService } from '../services/sla.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from '../services/audit.service.js';

export const slaController = {
  getPolicy: async (req, res, next) => {
    try {
      let policy = await SLAPolicy.findOne({ organization: req.organizationId });
      if (!policy) {
        policy = await SLAPolicy.findOne({ isDefault: true });
      }
      res.status(200).json(ApiResponse.success(policy));
    } catch (error) {
      next(error);
    }
  },

  updatePolicy: async (req, res, next) => {
    try {
      const { name, priorities, escalationEmail, description } = req.body;
      let policy = await SLAPolicy.findOne({ organization: req.organizationId });

      if (!policy) {
        policy = new SLAPolicy({
          name: name || 'Standard SLA Policy',
          organization: req.organizationId,
          isDefault: false,
        });
      }

      if (name) policy.name = name;
      if (description !== undefined) policy.description = description;
      if (priorities) {
        policy.priorities = {
          ...policy.priorities,
          ...priorities,
        };
      }
      if (escalationEmail !== undefined) policy.escalationEmail = escalationEmail;

      await policy.save();

      await auditService.log({
        organization: req.organizationId,
        actor: req.user._id,
        action: 'SLA_POLICY_UPDATED',
        resource: 'SLAPolicy',
        resourceId: policy._id,
        details: { priorities },
        req,
      });

      res.status(200).json(ApiResponse.success(policy, 'SLA Policy updated successfully.'));
    } catch (error) {
      next(error);
    }
  },

  triggerBreachCheck: async (req, res, next) => {
    try {
      const breachCount = await slaService.checkAndApplyBreaches(req.organizationId);
      res.status(200).json(
        ApiResponse.success({ breachCount }, `SLA monitor scan completed. Checked ${breachCount} tickets.`)
      );
    } catch (error) {
      next(error);
    }
  },
};
