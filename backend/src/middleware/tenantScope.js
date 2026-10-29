import { ApiError } from '../utils/ApiError.js';

export const tenantScope = (req, res, next) => {
  if (!req.user || !req.organizationId) {
    return next(ApiError.unauthorized('Organization context required'));
  }

  // Pre-bind query filter helper onto req
  req.tenantFilter = (additionalFilter = {}) => {
    return {
      organization: req.organizationId,
      ...additionalFilter,
    };
  };

  next();
};
