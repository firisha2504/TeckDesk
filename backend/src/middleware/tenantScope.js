import { ApiError } from '../utils/ApiError.js';

export const tenantScope = (req, res, next) => {
  // 1. Superadmin role handling
  if (req.user?.role === 'superadmin') {
    req.tenantFilter = (additionalFilter = {}) => {
      const filter = { ...additionalFilter };
      if (req.query?.organizationId) {
        filter.organization = req.query.organizationId;
      }
      return filter;
    };
    return next();
  }

  // 2. Organization-level role validation
  if (!req.user || !req.organizationId) {
    return next(ApiError.unauthorized('Organization context required'));
  }

  // 3. Security: Prevent parameter tampering.
  // Override any caller-supplied organization in body with authenticated organizationId
  if (req.body && typeof req.body === 'object' && 'organization' in req.body) {
    req.body.organization = req.organizationId;
  }

  // Reject cross-organization query parameter manipulation attempts
  if (req.query && typeof req.query === 'object' && req.query.organizationId) {
    if (req.query.organizationId.toString() !== req.organizationId.toString()) {
      return next(
        ApiError.forbidden(
          'Security violation: Cross-organization query parameter manipulation detected.'
        )
      );
    }
  }

  // Reject cross-organization route parameter manipulation attempts
  if (req.params && typeof req.params === 'object' && req.params.organizationId) {
    if (req.params.organizationId.toString() !== req.organizationId.toString()) {
      return next(
        ApiError.forbidden(
          'Security violation: Cross-organization route parameter manipulation detected.'
        )
      );
    }
  }

  // Pre-bind trusted query filter helper onto req
  req.tenantFilter = (additionalFilter = {}) => {
    return {
      organization: req.organizationId,
      ...additionalFilter,
    };
  };

  next();
};
