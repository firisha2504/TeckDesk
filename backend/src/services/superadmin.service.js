import mongoose from 'mongoose';
import { Organization } from '../models/Organization.js';
import { User } from '../models/User.js';
import { Ticket } from '../models/Ticket.js';
import { Team } from '../models/Team.js';
import { SLAPolicy } from '../models/SLAPolicy.js';
import { AuditLog } from '../models/AuditLog.js';
import { ApiError } from '../utils/ApiError.js';
import { auditService } from './audit.service.js';

export const superadminService = {
  /**
   * Helper to ensure valid ObjectId
   */
  _validateOrgId: (orgId) => {
    if (!orgId || !mongoose.Types.ObjectId.isValid(orgId)) {
      throw ApiError.badRequest('Invalid organization ID format.');
    }
  },

  /**
   * Get platform-wide overview metrics for Super Admin dashboard
   */
  getPlatformOverview: async () => {
    const [
      totalOrganizations,
      activeOrganizations,
      pendingOrganizations,
      suspendedOrganizations,
      rejectedOrganizations,
      trialOrganizations,
      totalUsers,
      activeUsers,
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      breachedTickets,
    ] = await Promise.all([
      Organization.countDocuments(),
      Organization.countDocuments({ status: 'active' }),
      Organization.countDocuments({ status: 'pending' }),
      Organization.countDocuments({ status: 'suspended' }),
      Organization.countDocuments({ status: 'rejected' }),
      Organization.countDocuments({ status: 'trial' }),
      User.countDocuments({ role: { $ne: 'superadmin' } }),
      User.countDocuments({ role: { $ne: 'superadmin' }, isActive: true }),
      Ticket.countDocuments(),
      Ticket.countDocuments({ status: { $in: ['Open', 'Assigned'] } }),
      Ticket.countDocuments({ status: 'In Progress' }),
      Ticket.countDocuments({ status: 'Resolved' }),
      Ticket.countDocuments({ status: 'Closed' }),
      Ticket.countDocuments({ slaBreached: true }),
    ]);

    const recentOrganizations = await Organization.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Attach admin email and user/ticket count to recent organizations
    const enrichedRecentOrgs = await Promise.all(
      recentOrganizations.map(async (org) => {
        const [adminUser, userCount, ticketCount] = await Promise.all([
          User.findOne({ organization: org._id, role: 'admin' })
            .select('name email')
            .lean(),
          User.countDocuments({ organization: org._id }),
          Ticket.countDocuments({ organization: org._id }),
        ]);
        return {
          ...org,
          adminEmail: adminUser?.email || 'N/A',
          adminName: adminUser?.name || 'N/A',
          userCount,
          ticketCount,
        };
      })
    );

    const recentAuditLogs = await AuditLog.find()
      .populate('actor', 'name email role')
      .populate('organization', 'name slug')
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    return {
      organizations: {
        total: totalOrganizations,
        active: activeOrganizations,
        pending: pendingOrganizations,
        suspended: suspendedOrganizations,
        rejected: rejectedOrganizations,
        trial: trialOrganizations,
      },
      users: {
        total: totalUsers,
        active: activeUsers,
      },
      tickets: {
        total: totalTickets,
        open: openTickets,
        inProgress: inProgressTickets,
        resolved: resolvedTickets,
        closed: closedTickets,
        breached: breachedTickets,
      },
      recentOrganizations: enrichedRecentOrgs,
      recentAuditLogs,
    };
  },

  /**
   * List organizations with pagination, search, status, and plan filters
   */
  listOrganizations: async ({
    page = 1,
    limit = 20,
    status,
    plan,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
  }) => {
    const query = {};

    if (status) {
      query.status = status;
    }

    if (plan) {
      query.plan = plan;
    }

    if (search && search.trim()) {
      const sanitized = search.trim();
      query.$or = [
        { name: { $regex: sanitized, $options: 'i' } },
        { slug: { $regex: sanitized, $options: 'i' } },
        { domain: { $regex: sanitized, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [organizations, total] = await Promise.all([
      Organization.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Organization.countDocuments(query),
    ]);

    // Attach user count, ticket count, team count and admin user
    const orgsWithDetails = await Promise.all(
      organizations.map(async (org) => {
        const [userCount, ticketCount, teamCount, adminUser] = await Promise.all([
          User.countDocuments({ organization: org._id }),
          Ticket.countDocuments({ organization: org._id }),
          Team.countDocuments({ organization: org._id }),
          User.findOne({ organization: org._id, role: 'admin' })
            .select('name email phone createdAt')
            .lean(),
        ]);

        return {
          ...org,
          userCount,
          ticketCount,
          teamCount,
          adminUser: adminUser || null,
        };
      })
    );

    return {
      organizations: orgsWithDetails,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  },

  /**
   * View individual organization details with user breakdown, ticket breakdown, and SLA
   */
  getOrganizationDetails: async (orgId) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId).lean();
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const [
      adminUsers,
      totalUsers,
      activeUsers,
      inactiveUsers,
      employeeCount,
      technicianCount,
      managerCount,
      adminCount,
      totalTickets,
      openTickets,
      inProgressTickets,
      assignedTickets,
      resolvedTickets,
      closedTickets,
      breachedTickets,
      priorityBreakdown,
      teams,
      slaPolicies,
      recentTickets,
    ] = await Promise.all([
      User.find({ organization: orgId, role: 'admin' })
        .select('name email phone avatar isActive createdAt lastLogin')
        .lean(),
      User.countDocuments({ organization: orgId }),
      User.countDocuments({ organization: orgId, isActive: true }),
      User.countDocuments({ organization: orgId, isActive: false }),
      User.countDocuments({ organization: orgId, role: 'employee' }),
      User.countDocuments({ organization: orgId, role: 'technician' }),
      User.countDocuments({ organization: orgId, role: 'manager' }),
      User.countDocuments({ organization: orgId, role: 'admin' }),
      Ticket.countDocuments({ organization: orgId }),
      Ticket.countDocuments({ organization: orgId, status: 'Open' }),
      Ticket.countDocuments({ organization: orgId, status: 'In Progress' }),
      Ticket.countDocuments({ organization: orgId, status: 'Assigned' }),
      Ticket.countDocuments({ organization: orgId, status: 'Resolved' }),
      Ticket.countDocuments({ organization: orgId, status: 'Closed' }),
      Ticket.countDocuments({ organization: orgId, slaBreached: true }),
      Promise.all([
        Ticket.countDocuments({ organization: orgId, priority: 'Critical' }),
        Ticket.countDocuments({ organization: orgId, priority: 'High' }),
        Ticket.countDocuments({ organization: orgId, priority: 'Medium' }),
        Ticket.countDocuments({ organization: orgId, priority: 'Low' }),
      ]),
      Team.find({ organization: orgId })
        .populate('lead', 'name email')
        .select('name lead members specialties isActive')
        .lean(),
      SLAPolicy.find({ organization: orgId }).lean(),
      Ticket.find({ organization: orgId })
        .select('ticketNumber title status priority createdAt updatedAt')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean(),
    ]);

    return {
      organization,
      admins: adminUsers,
      stats: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: inactiveUsers,
          roles: {
            admin: adminCount,
            manager: managerCount,
            technician: technicianCount,
            employee: employeeCount,
          },
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          inProgress: inProgressTickets,
          assigned: assignedTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          breached: breachedTickets,
          priority: {
            critical: priorityBreakdown[0],
            high: priorityBreakdown[1],
            medium: priorityBreakdown[2],
            low: priorityBreakdown[3],
          },
        },
        teams: {
          total: teams.length,
          list: teams,
        },
        slaPolicies: {
          total: slaPolicies.length,
          list: slaPolicies,
        },
        recentTickets,
      },
    };
  },

  /**
   * Get organization-level detailed statistics
   */
  getOrganizationStats: async (orgId) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId).select('name slug status plan').lean();
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const [
      totalUsers,
      activeUsers,
      totalTickets,
      openTickets,
      resolvedTickets,
      closedTickets,
      breachedTickets,
      totalTeams,
    ] = await Promise.all([
      User.countDocuments({ organization: orgId }),
      User.countDocuments({ organization: orgId, isActive: true }),
      Ticket.countDocuments({ organization: orgId }),
      Ticket.countDocuments({ organization: orgId, status: { $in: ['Open', 'Assigned', 'In Progress'] } }),
      Ticket.countDocuments({ organization: orgId, status: 'Resolved' }),
      Ticket.countDocuments({ organization: orgId, status: 'Closed' }),
      Ticket.countDocuments({ organization: orgId, slaBreached: true }),
      Team.countDocuments({ organization: orgId }),
    ]);

    const resolutionRate =
      totalTickets > 0
        ? Math.round(((resolvedTickets + closedTickets) / totalTickets) * 100)
        : 0;

    const slaComplianceRate =
      totalTickets > 0
        ? Math.max(0, Math.round(((totalTickets - breachedTickets) / totalTickets) * 100))
        : 100;

    return {
      organization,
      metrics: {
        users: {
          total: totalUsers,
          active: activeUsers,
        },
        tickets: {
          total: totalTickets,
          open: openTickets,
          resolved: resolvedTickets,
          closed: closedTickets,
          breached: breachedTickets,
          resolutionRatePercent: resolutionRate,
          slaCompliancePercent: slaComplianceRate,
        },
        teams: {
          total: totalTeams,
        },
      },
    };
  },

  /**
   * Approve a pending organization registration
   */
  approveOrganization: async (orgId, req) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const previousStatus = organization.status;
    organization.status = 'active';
    await organization.save();

    await auditService.log({
      organization: organization._id,
      actor: req.user._id,
      action: 'ORGANIZATION_APPROVED',
      resource: 'Organization',
      resourceId: organization._id.toString(),
      details: {
        organizationName: organization.name,
        previousStatus,
        newStatus: 'active',
        approvedBy: req.user.email,
      },
      req,
    });

    return organization;
  },

  /**
   * Reject an organization registration
   */
  rejectOrganization: async (orgId, { reason = '' }, req) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const previousStatus = organization.status;
    organization.status = 'rejected';
    await organization.save();

    await auditService.log({
      organization: organization._id,
      actor: req.user._id,
      action: 'ORGANIZATION_REJECTED',
      resource: 'Organization',
      resourceId: organization._id.toString(),
      details: {
        organizationName: organization.name,
        previousStatus,
        newStatus: 'rejected',
        reason,
        rejectedBy: req.user.email,
      },
      req,
    });

    return organization;
  },

  /**
   * Suspend an organization
   */
  suspendOrganization: async (orgId, { reason = '' }, req) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const previousStatus = organization.status;
    organization.status = 'suspended';
    await organization.save();

    await auditService.log({
      organization: organization._id,
      actor: req.user._id,
      action: 'ORGANIZATION_SUSPENDED',
      resource: 'Organization',
      resourceId: organization._id.toString(),
      details: {
        organizationName: organization.name,
        previousStatus,
        newStatus: 'suspended',
        reason,
        suspendedBy: req.user.email,
      },
      req,
    });

    return organization;
  },

  /**
   * Reactivate a suspended organization
   */
  reactivateOrganization: async (orgId, req) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const previousStatus = organization.status;
    organization.status = 'active';
    await organization.save();

    await auditService.log({
      organization: organization._id,
      actor: req.user._id,
      action: 'ORGANIZATION_REACTIVATED',
      resource: 'Organization',
      resourceId: organization._id.toString(),
      details: {
        organizationName: organization.name,
        previousStatus,
        newStatus: 'active',
        reactivatedBy: req.user.email,
      },
      req,
    });

    return organization;
  },

  /**
   * Update organization information (name, domain, plan, settings)
   */
  updateOrganization: async (orgId, updateData, req) => {
    superadminService._validateOrgId(orgId);

    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const changes = {};

    if (updateData.name && updateData.name !== organization.name) {
      changes.name = { from: organization.name, to: updateData.name };
      organization.name = updateData.name;
    }

    if (updateData.domain !== undefined && updateData.domain !== organization.domain) {
      changes.domain = { from: organization.domain, to: updateData.domain };
      organization.domain = updateData.domain;
    }

    if (updateData.plan && updateData.plan !== organization.plan) {
      changes.plan = { from: organization.plan, to: updateData.plan };
      organization.plan = updateData.plan;
    }

    if (updateData.status && updateData.status !== organization.status) {
      changes.status = { from: organization.status, to: updateData.status };
      organization.status = updateData.status;
    }

    if (updateData.settings) {
      if (!organization.settings) {
        organization.settings = {};
      }
      if (updateData.settings.allowRegistration !== undefined) {
        organization.settings.allowRegistration = updateData.settings.allowRegistration;
      }
      if (updateData.settings.defaultTicketPriority) {
        organization.settings.defaultTicketPriority = updateData.settings.defaultTicketPriority;
      }
      if (updateData.settings.businessHours) {
        organization.settings.businessHours = {
          start: updateData.settings.businessHours.start || organization.settings.businessHours?.start || '09:00',
          end: updateData.settings.businessHours.end || organization.settings.businessHours?.end || '18:00',
          timeZone: updateData.settings.businessHours.timeZone || organization.settings.businessHours?.timeZone || 'UTC',
        };
      }
      changes.settings = updateData.settings;
    }

    await organization.save();

    await auditService.log({
      organization: organization._id,
      actor: req.user._id,
      action: 'ORGANIZATION_UPDATED',
      resource: 'Organization',
      resourceId: organization._id.toString(),
      details: {
        organizationName: organization.name,
        changes,
        updatedBy: req.user.email,
      },
      req,
    });

    return organization;
  },

  /**
   * Generic organization status update
   */
  updateOrganizationStatus: async (orgId, { status, reason = '' }, req) => {
    superadminService._validateOrgId(orgId);

    const validStatuses = ['active', 'pending', 'suspended', 'rejected', 'trial'];
    if (!validStatuses.includes(status)) {
      throw ApiError.badRequest(`Invalid organization status. Valid options: ${validStatuses.join(', ')}`);
    }

    const organization = await Organization.findById(orgId);
    if (!organization) {
      throw ApiError.notFound('Organization not found.');
    }

    const previousStatus = organization.status;
    organization.status = status;
    await organization.save();

    await auditService.log({
      organization: organization._id,
      actor: req.user._id,
      action: 'ORGANIZATION_STATUS_UPDATED',
      resource: 'Organization',
      resourceId: organization._id.toString(),
      details: {
        organizationName: organization.name,
        previousStatus,
        newStatus: status,
        reason,
        updatedBy: req.user.email,
      },
      req,
    });

    return organization;
  },

  /**
   * Retrieve organization activity (audit logs for a specific organization)
   */
  getOrganizationActivity: async (orgId, { page = 1, limit = 25, action, resource }) => {
    superadminService._validateOrgId(orgId);

    const query = { organization: orgId };
    if (action) query.action = action;
    if (resource) query.resource = resource;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  },

  /**
   * Retrieve platform-wide audit logs
   */
  getGlobalAuditLogs: async ({ page = 1, limit = 50, organization, action, resource, actor }) => {
    const query = {};
    if (organization && mongoose.Types.ObjectId.isValid(organization)) {
      query.organization = organization;
    }
    if (action) query.action = action;
    if (resource) query.resource = resource;
    if (actor && mongoose.Types.ObjectId.isValid(actor)) {
      query.actor = actor;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
    const skip = (pageNum - 1) * limitNum;

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actor', 'name email role')
        .populate('organization', 'name slug status')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
    };
  },
};
