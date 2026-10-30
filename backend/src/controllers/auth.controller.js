import { authService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { env } from '../config/env.js';

// Cookie options for secure session token
const getCookieOptions = () => ({
  httpOnly: true,
  secure: env.IS_PROD,
  sameSite: env.IS_PROD ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});

export const authController = {
  registerOrganization: async (req, res, next) => {
    try {
      const result = await authService.registerOrganization(req.body, req);
      res.status(201).json(ApiResponse.created(result, result.message));
    } catch (error) {
      next(error);
    }
  },

  registerEmployee: async (req, res, next) => {
    try {
      const { user, token } = await authService.registerEmployee(req.body, req);
      res.cookie('token', token, getCookieOptions());
      res.status(201).json(ApiResponse.created({ user, token }, 'Employee registered successfully.'));
    } catch (error) {
      next(error);
    }
  },

  register: async (req, res, next) => {
    try {
      const result = await authService.register(req.body, req);
      if (result.token) {
        res.cookie('token', result.token, getCookieOptions());
      }
      res.status(201).json(ApiResponse.created(result, result.message || 'Registered successfully.'));
    } catch (error) {
      next(error);
    }
  },

  login: async (req, res, next) => {
    try {
      const { user, token } = await authService.login(req.body, req);
      res.cookie('token', token, getCookieOptions());
      res.status(200).json(ApiResponse.success({ user, token }, 'Signed in successfully.'));
    } catch (error) {
      next(error);
    }
  },

  logout: async (req, res) => {
    res.clearCookie('token', {
      httpOnly: true,
      secure: env.IS_PROD,
      sameSite: env.IS_PROD ? 'none' : 'lax',
    });
    res.status(200).json(ApiResponse.success(null, 'Signed out successfully.'));
  },

  getCurrentUser: async (req, res) => {
    res.status(200).json(ApiResponse.success(req.user, 'Current user retrieved.'));
  },

  forgotPassword: async (req, res, next) => {
    try {
      const result = await authService.forgotPassword(req.body.email, req);
      res.status(200).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  },

  resetPassword: async (req, res, next) => {
    try {
      const result = await authService.resetPassword(req.body, req);
      res.status(200).json(ApiResponse.success(null, result.message));
    } catch (error) {
      next(error);
    }
  },
};
