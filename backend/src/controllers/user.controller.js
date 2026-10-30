import path from 'path';
import fs from 'fs';
import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from '../services/audit.service.js';
import { avatarDir } from '../config/storage.js';
import { logger } from '../utils/logger.js';

/**
 * Safely removes a previously uploaded custom avatar.
 * Guarantees that default avatars and files belonging to other users are never unlinked.
 */
const safeDeleteOldAvatar = async (currentAvatarUrl, userId) => {
  if (!currentAvatarUrl || typeof currentAvatarUrl !== 'string') return;
  if (!currentAvatarUrl.includes('/uploads/avatars/')) return;

  const oldFilename = path.basename(currentAvatarUrl);
  // Ensure the filename actually begins with avatar-<userId>- so other users' or default avatars are NEVER touched
  if (!oldFilename.startsWith(`avatar-${userId}-`)) return;

  const resolvedAvatarDir = path.resolve(avatarDir);
  const oldFilePath = path.resolve(resolvedAvatarDir, oldFilename);

  // Anti-path traversal validation
  if (!oldFilePath.startsWith(resolvedAvatarDir)) return;

  if (fs.existsSync(oldFilePath)) {
    try {
      await fs.promises.unlink(oldFilePath);
    } catch (err) {
      logger.warn(`Failed to safely unlink previous avatar ${oldFilename}:`, err);
    }
  }
};

export const userController = {
  getUsers: async (req, res, next) => {
    try {
      const { role, team, search } = req.query;
      const query = { organization: req.organizationId };

      if (role) query.role = role;
      if (team) query.team = team;
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
        ];
      }

      const users = await User.find(query)
        .populate('team', 'name specialties')
        .sort({ name: 1 })
        .lean();

      res.status(200).json(ApiResponse.success(users));
    } catch (error) {
      next(error);
    }
  },

  getUserById: async (req, res, next) => {
    try {
      const user = await User.findOne({
        _id: req.params.id,
        organization: req.organizationId,
      }).populate('team', 'name specialties');

      if (!user) {
        throw ApiError.notFound('User not found');
      }

      res.status(200).json(ApiResponse.success(user));
    } catch (error) {
      next(error);
    }
  },

  updateProfile: async (req, res, next) => {
    try {
      const { name, avatar, skills, currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user._id).select('+password');

      if (name) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;
      if (skills) user.skills = skills;

      if (newPassword) {
        if (!currentPassword) {
          throw ApiError.badRequest('Current password is required to set a new password');
        }
        const isMatch = await user.comparePassword(currentPassword);
        if (!isMatch) {
          throw ApiError.badRequest('Current password does not match');
        }
        user.password = newPassword;
      }

      await user.save();

      await auditService.log({
        organization: req.organizationId,
        actor: user._id,
        action: 'PROFILE_UPDATED',
        resource: 'User',
        resourceId: user._id,
        req,
      });

      const updated = await User.findById(user._id).populate('team', 'name specialties');
      res.status(200).json(ApiResponse.success(updated, 'Profile updated successfully'));
    } catch (error) {
      next(error);
    }
  },

  /**
   * Secure profile avatar upload
   * Authenticates user via JWT and strictly operates on req.user._id
   */
  uploadAvatar: async (req, res, next) => {
    try {
      if (!req.file) {
        throw ApiError.badRequest('No image file provided. Please select a JPG, JPEG, PNG, or WebP photo.');
      }

      // Identify user strictly from authenticated JWT
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        throw ApiError.notFound('User not found.');
      }

      // Safely delete previous custom avatar if present
      await safeDeleteOldAvatar(user.avatar, userId);

      // Store relative path in user document
      const avatarUrl = `/uploads/avatars/${req.file.filename}`;
      user.avatar = avatarUrl;
      await user.save();

      await auditService.log({
        organization: req.organizationId || user.organization,
        actor: userId,
        action: 'AVATAR_UPDATED',
        resource: 'User',
        resourceId: userId,
        details: { filename: req.file.filename, size: req.file.size },
        req,
      });

      const updatedUser = await User.findById(userId)
        .populate('organization', 'name slug settings status plan')
        .populate('team', 'name specialties');

      res.status(200).json(
        ApiResponse.success(
          {
            user: updatedUser,
            avatarUrl,
          },
          'Profile picture updated successfully'
        )
      );
    } catch (error) {
      if (req.file?.path && fs.existsSync(req.file.path)) {
        try {
          fs.unlinkSync(req.file.path);
        } catch {}
      }
      next(error);
    }
  },

  /**
   * Remove custom profile avatar and revert to default
   */
  removeAvatar: async (req, res, next) => {
    try {
      const userId = req.user._id;
      const user = await User.findById(userId);

      if (!user) {
        throw ApiError.notFound('User not found.');
      }

      if (user.avatar) {
        await safeDeleteOldAvatar(user.avatar, userId);
        user.avatar = '';
        await user.save();

        await auditService.log({
          organization: req.organizationId || user.organization,
          actor: userId,
          action: 'AVATAR_REMOVED',
          resource: 'User',
          resourceId: userId,
          req,
        });
      }

      const updatedUser = await User.findById(userId)
        .populate('organization', 'name slug settings status plan')
        .populate('team', 'name specialties');

      res.status(200).json(
        ApiResponse.success(
          {
            user: updatedUser,
            avatarUrl: '',
          },
          'Profile picture removed successfully'
        )
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Serve avatar image with strict directory isolation and anti-traversal
   */
  getAvatar: async (req, res, next) => {
    try {
      const sanitized = path.basename(req.params.filename);
      const resolvedAvatarDir = path.resolve(avatarDir);
      const safePath = path.resolve(resolvedAvatarDir, sanitized);

      if (!safePath.startsWith(resolvedAvatarDir)) {
        throw ApiError.forbidden('Access denied: Path traversal detected.');
      }

      if (!fs.existsSync(safePath)) {
        throw ApiError.notFound('Profile image not found.');
      }

      res.sendFile(safePath);
    } catch (error) {
      next(error);
    }
  },

  updateUserRole: async (req, res, next) => {
    try {
      const { role, teamId, isActive, skills } = req.body;
      const targetUser = await User.findOne({
        _id: req.params.id,
        organization: req.organizationId,
      });

      if (!targetUser) {
        throw ApiError.notFound('User not found');
      }

      if (role) targetUser.role = role;
      if (teamId !== undefined) targetUser.team = teamId || null;
      if (isActive !== undefined) targetUser.isActive = isActive;
      if (skills) targetUser.skills = skills;

      await targetUser.save();

      await auditService.log({
        organization: req.organizationId,
        actor: req.user._id,
        action: 'USER_ROLE_UPDATED',
        resource: 'User',
        resourceId: targetUser._id,
        details: { role, teamId, isActive },
        req,
      });

      const updated = await User.findById(targetUser._id).populate('team', 'name specialties');
      res.status(200).json(ApiResponse.success(updated, 'User updated successfully'));
    } catch (error) {
      next(error);
    }
  },
};

