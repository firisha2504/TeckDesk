import { ApiError } from '../utils/ApiError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Role must be explicitly included in allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to perform this action.`
        )
      );
    }

    // Tenant-scoped roles must possess a verified organizationId
    if (['admin', 'manager', 'technician', 'employee'].includes(req.user.role)) {
      if (!req.organizationId || !req.user.organization) {
        return next(
          ApiError.forbidden(
            'Access denied. Organization context required for tenant-scoped operations.'
          )
        );
      }
    }

    next();
  };
};
