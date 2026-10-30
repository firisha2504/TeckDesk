import { ApiError } from '../utils/ApiError.js';

export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    const rawRole = req.user.role ? String(req.user.role).toLowerCase().trim() : '';
    // Normalize role aliases (organizationadmin <-> admin)
    const userRole = rawRole === 'organizationadmin' ? 'admin' : rawRole;
    const normalizedAllowed = allowedRoles.map((r) => {
      const lr = String(r).toLowerCase().trim();
      return lr === 'organizationadmin' ? 'admin' : lr;
    });

    // Role must be explicitly included in allowedRoles
    if (!normalizedAllowed.includes(userRole)) {
      return next(
        ApiError.forbidden(
          `Access denied. Role '${req.user.role}' is not authorized to perform this action.`
        )
      );
    }

    // Tenant-scoped roles must possess a verified organizationId
    if (['admin', 'manager', 'technician', 'employee'].includes(userRole)) {
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
