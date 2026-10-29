import jwt from 'jsonwebtoken';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { env } from '../config/env.js';

export const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // 1. Check HTTP-only cookie first
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // 2. Check Authorization Bearer header
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(ApiError.unauthorized('Authentication token missing. Please sign in.'));
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (jwtErr) {
      if (jwtErr.name === 'TokenExpiredError') {
        return next(ApiError.unauthorized('Session expired. Please sign in again.'));
      }
      return next(ApiError.unauthorized('Invalid authentication token.'));
    }

    // Fetch user from DB
    const user = await User.findById(decoded.id)
      .populate('organization', 'name slug settings')
      .populate('team', 'name specialties');

    if (!user) {
      return next(ApiError.unauthorized('User associated with this token no longer exists.'));
    }

    if (!user.isActive) {
      return next(ApiError.forbidden('Your account has been deactivated. Please contact an administrator.'));
    }

    req.user = user;
    req.organizationId = user.organization?._id || user.organization;
    next();
  } catch (error) {
    next(error);
  }
};
