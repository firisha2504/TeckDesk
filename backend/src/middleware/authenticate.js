import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check Authorization Bearer header first (explicit client token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      const parts = req.headers.authorization.split(' ');
      if (parts.length === 2 && parts[1] && parts[1] !== 'undefined' && parts[1] !== 'null') {
        token = parts[1].trim();
      }
    }

    // 2. Fallback to HTTP-only cookie if Authorization header is not provided
    if (!token && req.cookies && req.cookies.token) {
      if (req.cookies.token !== 'undefined' && req.cookies.token !== 'null') {
        token = req.cookies.token;
      }
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing. Please sign in.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtErr) {
      // Clear poisoned cookie if present so it doesn't break subsequent requests
      if (req.cookies && req.cookies.token) {
        res.clearCookie('token', {
          httpOnly: true,
          secure: env.IS_PROD,
          sameSite: env.IS_PROD ? 'none' : 'lax',
        });
      }

      if (jwtErr.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session expired. Please sign in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // Fetch user from DB
    const user = await User.findById(decoded.id)
      .populate('organization', 'name slug settings status plan')
      .populate('team', 'name specialties');

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact an administrator.'));
    }

    // Check organization lifecycle status for tenant users
    if (user.role !== 'superadmin' && user.organization) {
      const orgStatus = user.organization.status;
      if (orgStatus === 'suspended') {
        return next(
          ApiError.forbidden(
            'Your organization has been suspended by the platform administrator. Access to services is revoked.'
          )
        );
      }
      if (orgStatus === 'pending') {
        return next(
          ApiError.forbidden(
            'Your organization registration is pending review by the platform administrator.'
          )
        );
      }
      if (orgStatus === 'rejected') {
        return next(
          ApiError.forbidden('Your organization registration was rejected. Access is denied.')
        );
      }
    }

    req.user = user;
    req.organizationId = user.organization?._id || user.organization || null;
    next();
  } catch (error) {
    next(error);
  }
};
