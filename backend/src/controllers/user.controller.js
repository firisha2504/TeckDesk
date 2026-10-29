import { User } from '../models/User.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from '../services/audit.service.js';

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
