import { AuditLog } from '../models/AuditLog.js';
import { logger } from '../utils/logger.js';

export const auditService = {
  log: async ({
    organization = null,
    actor = null,
    action,
    resource,
    resourceId = null,
    details = {},
    req = null,
  }) => {
    try {
      const ipAddress = req?.ip || req?.headers['x-forwarded-for'] || '';
      const userAgent = req?.headers['user-agent'] || '';

      await AuditLog.create({
        organization: organization || actor?.organization || null,
        actor: actor?._id || actor || null,
        action,
        resource,
        resourceId: resourceId ? String(resourceId) : null,
        details,
        ipAddress,
        userAgent,
      });
    } catch (error) {
      logger.error('Failed to write audit log:', error);
      // Non-blocking: audit failure should not crash main business flow
    }
  },
};
