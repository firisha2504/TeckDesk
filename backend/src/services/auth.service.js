import crypto from 'crypto';
import { User } from '../models/User.js';
import { Organization } from '../models/Organization.js';
import { SLAPolicy } from '../models/SLAPolicy.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from './audit.service.js';
import { emailService } from './email.service.js';
import { logger } from '../utils/logger.js';

export const authService = {
  /**
   * Register a new organization and its primary Organization Admin.
   * New organizations are set to status: 'pending' awaiting Platform Super Admin approval.
   */
  registerOrganization: async (
    {
      organizationName,
      adminName,
      adminEmail,
      adminPassword,
      domain = '',
      type = 'Enterprise',
      officialEmail = '',
      phone = '',
      address = '',
      website = '',
    },
    req
  ) => {
    const emailNormalized = adminEmail.toLowerCase().trim();

    // 1. Check if admin email already exists
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      throw ApiError.conflict('A user with this email address already exists.');
    }

    // 2. Compute and validate unique slug
    const trimmedName = organizationName.trim();
    const slug = trimmedName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    if (!slug || slug.length < 2) {
      throw ApiError.badRequest('Invalid organization name. Must contain alphanumeric characters.');
    }

    // 3. Prevent duplicate organization registration by slug or exact name
    const existingOrg = await Organization.findOne({
      $or: [
        { slug },
        { name: { $regex: `^${trimmedName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' } },
      ],
    });

    if (existingOrg) {
      throw ApiError.conflict('An organization with this name or slug already exists.');
    }

    // 4. Create the organization in 'pending' status
    const organization = await Organization.create({
      name: trimmedName,
      slug,
      domain: domain ? domain.toLowerCase().trim() : '',
      type: type || 'Enterprise',
      officialEmail: officialEmail ? officialEmail.toLowerCase().trim() : '',
      phone: phone ? phone.trim() : '',
      address: address ? address.trim() : '',
      website: website ? website.trim() : '',
      status: 'pending', // Awaiting Super Admin approval
      plan: 'standard',
      settings: {
        allowRegistration: true,
        defaultTicketPriority: 'Medium',
        businessHours: { start: '09:00', end: '18:00', timeZone: 'UTC' },
      },
    });

    // 5. Create default SLA Policy for this new organization
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

    // 6. Create the Organization Admin user
    const adminUser = await User.create({
      name: adminName.trim(),
      email: emailNormalized,
      password: adminPassword,
      role: 'admin',
      organization: organization._id,
      isActive: true,
    });

    // 7. Audit log the registration
    await auditService.log({
      organization: organization._id,
      actor: adminUser._id,
      action: 'ORGANIZATION_REGISTERED',
      resource: 'Organization',
      resourceId: organization._id,
      details: { organizationName: organization.name, slug: organization.slug, adminEmail },
      req,
    });

    return {
      organization: {
        _id: organization._id,
        name: organization.name,
        slug: organization.slug,
        status: organization.status,
      },
      user: {
        _id: adminUser._id,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
      },
      message:
        'Organization registration submitted successfully. Your account is pending review by the Platform Super Admin.',
    };
  },

  /**
   * Register an employee under an existing, active organization.
   */
  registerEmployee: async ({ name, email, password, organizationSlug }, req) => {
    const emailNormalized = email.toLowerCase().trim();

    // 1. Check if user already exists
    const existingUser = await User.findOne({ email: emailNormalized });
    if (existingUser) {
      throw ApiError.conflict('A user with this email address already exists.');
    }

    // 2. Find organization by slug
    const organization = await Organization.findOne({
      slug: organizationSlug.toLowerCase().trim(),
    });
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    // 3. Verify organization is active
    if (organization.status !== 'active' && organization.status !== 'trial') {
      throw ApiError.forbidden(
        `Cannot join organization: Account status is '${organization.status}'. Only active organizations accept members.`
      );
    }

    // 4. Check if registration is allowed by organization settings
    if (organization.settings && organization.settings.allowRegistration === false) {
      throw ApiError.forbidden(
        'Self-registration is disabled for this organization. Please contact your administrator.'
      );
    }

    // 5. Create user strictly as 'employee' (prevents privilege escalation)
    const user = await User.create({
      name: name.trim(),
      email: emailNormalized,
      password,
      role: 'employee',
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
      .populate('organization', 'name slug status plan')
      .populate('team', 'name specialties');

    return { user: sanitizedUser, token };
  },

  /**
   * Backward-compatible registration handler
   */
  register: async (data, req) => {
    if (data.organizationName && data.adminName && data.adminEmail) {
      return authService.registerOrganization(data, req);
    }
    if (data.organizationSlug) {
      return authService.registerEmployee(data, req);
    }
    if (data.organizationName) {
      return authService.registerOrganization(
        {
          organizationName: data.organizationName,
          adminName: data.name,
          adminEmail: data.email,
          adminPassword: data.password,
        },
        req
      );
    }
    throw ApiError.badRequest('Please provide organization details or organization slug to register.');
  },

  login: async ({ email, password }, req) => {
    const user = await User.findOne({ email: email.toLowerCase().trim() })
      .select('+password')
      .populate('organization', 'name slug settings status plan')
      .populate('team', 'name specialties');

    if (!user) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw ApiError.unauthorized('Invalid email or password.');
    }

    if (!user.isActive) {
      throw ApiError.forbidden('Your account is deactivated. Please contact an administrator.');
    }

    // Tenant Organization Status Check (bypassed for Platform Super Admin)
    if (user.role !== 'superadmin') {
      if (!user.organization) {
        throw ApiError.forbidden('Account configuration error: No associated organization.');
      }

      const orgStatus = user.organization.status;
      if (orgStatus === 'pending') {
        throw ApiError.forbidden(
          'Your organization registration is currently pending review by Platform Super Admin. Access will be enabled upon approval.'
        );
      }
      if (orgStatus === 'suspended') {
        throw ApiError.forbidden(
          'Your organization account has been suspended. Please contact platform support.'
        );
      }
      if (orgStatus === 'rejected') {
        throw ApiError.forbidden(
          'Your organization registration was rejected. Please contact platform support.'
        );
      }
      if (orgStatus !== 'active' && orgStatus !== 'trial') {
        throw ApiError.forbidden('Your organization account is not currently active.');
      }
    }

    user.lastLoginAt = new Date();
    await user.save();

    const token = user.generateAuthToken();

    await auditService.log({
      organization: user.organization?._id || null,
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
