import crypto from 'crypto';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { SLAPolicy } from '../models/SLAPolicy.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from './audit.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

export const authService = {
  register: async ({ name, email, password, role = 'employee', organizationName }, req) => {
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      throw ApiError.conflict('A user with this email address already exists.');
    }

    // Resolve or create Organization
    let organization;
    if (organizationName) {
      const slug = organizationName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
      organization = await Organization.findOne({ slug });
      if (!organization) {
        organization = await Organization.create({
          name: organizationName,
          slug,
        });

        // Create default SLA policy for new organization
        await SLAPolicy.create({
          name: 'Standard SLA Policy',
          organization: organization._id,
          isDefault: true,
          priorities: {
            Critical: { responseTimeMinutes: 15, resolutionTimeMinutes: 120 },
            High: { responseTimeMinutes: 60, resolutionTimeMinutes: 480 },
            Medium: { responseTimeMinutes: 240, resolutionTimeMinutes: 1440 },
            Low: { responseTimeMinutes: 480, resolutionTimeMinutes: 2880 },
          },
        });
      }
    } else {
      organization = await Organization.findOne();
      if (!organization) {
        organization = await Organization.create({
          name: 'TechDesk Enterprise',
          slug: 'techdesk-enterprise',
        });

        await SLAPolicy.create({
          name: 'Standard SLA Policy',
          organization: organization._id,
          isDefault: true,
        });
      }
    }

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password,
      role: role || 'employee',
      organization: organization._id,
      isActive: true,
    });

    const token = user.generateAuthToken();

    await auditService.log({
      organization: organization._id,
      actor: user._id,
      action: 'USER_REGISTERED',
      resource: 'User',
      resourceId: user._id,
      details: { email: user.email, role: user.role },
      req,
    });

    const sanitizedUser = await User.findById(user._id)
      .populate('organization', 'name slug')
      .populate('team', 'name specialties');

    return { user: sanitizedUser, token };
  },

  login: async ({ email, password }, req) => {
    const user = await User.findOne({ email: email.toLowerCase() })
      .select('+password')
      .populate('organization', 'name slug settings')
      .populate('team', 'name specialties');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is inactive. Please contact your administrator.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = user.generateAuthToken();

    await auditService.log({
      organization: user.organization._id,
      actor: user._id,
      action: 'USER_LOGGED_IN',
      resource: 'User',
      resourceId: user._id,
      req,
    });

    // Strip password
    const userObj = user.toObject();
    delete userObj.password;

    return { user: userObj, token };
  },

  forgotPassword: async (email, req) => {
    const genericMessage =
      'If an account exists with this email, password reset instructions have been sent.';

    if (!email) {
      return { message: genericMessage };
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Return identical generic response to prevent user enumeration
      return { message: genericMessage };
    }

    // Generate crypto token (raw is sent via email, SHA-256 hash is stored in database)
    const resetToken = user.generateResetToken();
    await user.save();

    // Audit logging: NEVER include raw reset token or reset URL
    await auditService.log({
      organization: user.organization,
      actor: user._id,
      action: 'PASSWORD_RESET_REQUESTED',
      resource: 'User',
      resourceId: user._id,
      details: { email: user.email },
      req,
    });

    // Send email via configured SMTP; fail safely without exposing tokens
    try {
      await emailService.sendPasswordResetEmail({
        to: user.email,
        name: user.name,
        resetToken,
      });
    } catch (err) {
      logger.error('Failed to dispatch password reset email:', err.message);
    }

    // Never return resetToken in API response
    return {
      message: genericMessage,
    };
  },

  resetPassword: async ({ token, password }, req) => {
    if (!token || typeof token !== 'string') {
      throw ApiError.badRequest('Password reset token is invalid or has expired.');
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    // Find user with matching active unexpired reset token
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw ApiError.badRequest('Password reset token is invalid or has expired.');
    }

    // Update password
    user.password = password;

    // Single-use enforcement: clear token and expiration immediately
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    await auditService.log({
      organization: user.organization,
      actor: user._id,
      action: 'PASSWORD_RESET_COMPLETED',
      resource: 'User',
      resourceId: user._id,
      details: { email: user.email },
      req,
    });

    return { message: 'Password has been reset successfully. You can now log in.' };
  },
};
