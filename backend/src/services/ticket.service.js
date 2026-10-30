import { Ticket } from '../models/Ticket.js';
import { TicketComment } from '../models/TicketComment.js';
import { TicketEvent } from '../models/TicketEvent.js';
import { Attachment } from '../models/Attachment.js';
import { User } from '../models/User.js';
import { ApiError } from '../utils/ApiError.js';
import { slaService } from './sla.service.js';
import { assignmentService } from './assignment.service.js';
import { notificationService } from './notification.service.js';
import { broadcastTicketUpdate, ticketEvents } from '../sockets/ticket.socket.js';
import { auditService } from './audit.service.js';
import { logger } from '../utils/logger.js';

// Enforce valid status transitions
const VALID_TRANSITIONS = {
  Open: ['Assigned', 'In Progress', 'Closed'],
  Assigned: ['In Progress', 'Pending User', 'Closed'],
  'In Progress': ['Pending User', 'Resolved', 'Closed'],
  'Pending User': ['In Progress', 'Resolved', 'Closed'],
  Resolved: ['Closed', 'In Progress'],
  Closed: ['Open', 'In Progress'],
};

// Generate next sequential human-readable ticket number (TD-1001, TD-1002, etc.)
async function generateNextTicketNumber() {
  const lastTicket = await Ticket.findOne({})
    .sort({ createdAt: -1 })
    .select('ticketNumber');

  if (!lastTicket || !lastTicket.ticketNumber) {
    return 'TD-1001';
  }

  const match = lastTicket.ticketNumber.match(/TD-(\d+)/);
  if (match) {
    const nextSeq = parseInt(match[1], 10) + 1;
    return `TD-${nextSeq}`;
  }

  return `TD-${Math.floor(1000 + Math.random() * 9000)}`;
}

export const ticketService = {
  createTicket: async ({ title, description, category, priority = 'Medium' }, user, req) => {
    const organizationId = user.organization?._id || user.organization;
    let ticketNumber = await generateNextTicketNumber();

    // Compute SLA deadlines based on policy
    const slaCalculations = await slaService.calculateDeadlines(priority, organizationId);

    const ticket = new Ticket({
      ticketNumber,
      title,
      description,
      category,
      priority,
      status: 'Open',
      creator: user._id,
      organization: organizationId,
      slaPolicy: slaCalculations.policyId,
      sla: {
        responseDeadline: slaCalculations.responseDeadline,
        resolutionDeadline: slaCalculations.resolutionDeadline,
        isResponseBreached: false,
        isResolutionBreached: false,
      },
    });

    // Run intelligent technician auto-assignment
    const bestTechnician = await assignmentService.findBestTechnician(ticket);
    if (bestTechnician) {
      ticket.assignee = bestTechnician._id;
      ticket.team = bestTechnician.team?._id || bestTechnician.team || null;
      ticket.status = 'Assigned';
    }

    try {
      await ticket.save();
    } catch (saveErr) {
      if (saveErr.code === 11000) {
        ticket.ticketNumber = `TD-${Date.now().toString().slice(-5)}`;
        await ticket.save();
      } else {
        throw saveErr;
      }
    }

    // Create initial timeline event
    await TicketEvent.create({
      ticket: ticket._id,
      organization: organizationId,
      actor: user._id,
      eventType: 'CREATED',
      details: { priority, category },
      message: `Ticket ${ticketNumber} created by ${user.name}`,
    });

    if (bestTechnician) {
      await TicketEvent.create({
        ticket: ticket._id,
        organization: organizationId,
        actor: null,
        eventType: 'ASSIGNED',
        details: { assigneeId: bestTechnician._id, assigneeName: bestTechnician.name },
        message: `Intelligently auto-assigned to ${bestTechnician.name} based on skills & workload`,
      });

      // Notify the assigned technician
      await notificationService.createNotification({
        recipient: bestTechnician._id,
        organization: organizationId,
        title: `New Ticket Assigned: ${ticketNumber}`,
        message: `You have been assigned to ticket "${ticket.title}" (${ticket.priority} priority).`,
        type: 'TICKET_ASSIGNED',
        ticket: ticket._id,
      });
    }

    await auditService.log({
      organization: organizationId,
      actor: user._id,
      action: 'TICKET_CREATED',
      resource: 'Ticket',
      resourceId: ticket._id,
      details: { ticketNumber, priority, category },
      req,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('creator', 'name email role avatar')
      .populate('assignee', 'name email role avatar')
      .populate('team', 'name specialties');

    broadcastTicketUpdate(populatedTicket, ticketEvents.CREATED);

    return populatedTicket;
  },

  listTickets: async (queryFilters, user) => {
    const {
      page = 1,
      limit = 15,
      status,
      priority,
      category,
      search,
      assignee,
      creator,
      overdue,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = queryFilters;

    const orgId = user.organization?._id || user.organization;
    const query = {};
    if (orgId) {
      query.organization = orgId;
    } else if (queryFilters.organizationId) {
      query.organization = queryFilters.organizationId;
    }

    // Role-based scoping:
    if (user.role === 'employee') {
      // Employees can only view tickets they created
      query.creator = user._id;
    } else if (user.role === 'technician') {
      // Technicians can ONLY view tickets currently assigned to their own authenticated user ID
      if (user.canViewTeamTickets && user.team) {
        const teamId = user.team._id || user.team;
        query.$or = [
          { assignee: user._id },
          { team: teamId, ...(user.canViewUnassignedTeam ? {} : { assignee: user._id }) },
        ];
      } else {
        query.assignee = user._id;
      }
    } else if (assignee) {
      query.assignee = assignee === 'unassigned' ? null : assignee;
    }

    if (status) {
      query.status = status;
    }

    if (priority) {
      query.priority = priority;
    }

    if (category) {
      query.category = category;
    }

    if (creator && user.role !== 'employee') {
      query.creator = creator;
    }

    if (overdue === 'true') {
      query.status = { $nin: ['Resolved', 'Closed'] };
      query['sla.resolutionDeadline'] = { $lt: new Date() };
    }

    if (search) {
      const searchConditions = [
        { ticketNumber: { $regex: search, $options: 'i' } },
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [tickets, total] = await Promise.all([
      Ticket.find(query)
        .populate('creator', 'name email role avatar')
        .populate('assignee', 'name email role avatar')
        .populate('team', 'name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10))
        .lean(),
      Ticket.countDocuments(query),
    ]);

    return {
      tickets,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      limit: parseInt(limit, 10),
    };
  },

  getTicketById: async (ticketId, user) => {
    const orgId = user.organization?._id || user.organization;
    const query = {
      _id: ticketId,
    };
    if (orgId) {
      query.organization = orgId;
    }

    if (user.role === 'employee') {
      query.creator = user._id;
    } else if (user.role === 'technician') {
      if (user.canViewTeamTickets && user.team) {
        const teamId = user.team._id || user.team;
        query.$or = [
          { assignee: user._id },
          { team: teamId, ...(user.canViewUnassignedTeam ? {} : { assignee: user._id }) },
        ];
      } else {
        query.assignee = user._id;
      }
    }

    const ticket = await Ticket.findOne(query)
      .populate('creator', 'name email role avatar')
      .populate('assignee', 'name email role avatar skills')
      .populate('team', 'name specialties')
      .populate('attachments')
      .populate('slaPolicy')
      .populate({
        path: 'pendingReassignment',
        populate: [
          { path: 'originalTechnician', select: 'name email role avatar skills' },
          { path: 'targetTechnician', select: 'name email role avatar skills' },
          { path: 'targetTeam', select: 'name specialties' },
          { path: 'reviewedBy', select: 'name email role' },
        ],
      });

    if (!ticket) {
      throw ApiError.notFound('Ticket not found or you do not have permission to view it.');
    }

    return ticket;
  },

  changeStatus: async (ticketId, { status: newStatus, resolutionNotes = '' }, user, req) => {
    const orgId = user.organization?._id || user.organization;
    const ticketQuery = { _id: ticketId };
    if (orgId) ticketQuery.organization = orgId;

    if (user.role === 'employee') {
      ticketQuery.creator = user._id;
    } else if (user.role === 'technician') {
      ticketQuery.assignee = user._id;
    }

    const ticket = await Ticket.findOne(ticketQuery).populate('creator assignee');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found or you do not have permission to update it.');
    }

    const currentStatus = ticket.status;

    if (currentStatus === newStatus) {
      return ticket;
    }

    // Validate valid status transition
    const allowedTransitions = VALID_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(newStatus)) {
      throw ApiError.badRequest(
        `Invalid status transition from '${currentStatus}' to '${newStatus}'. Allowed: ${allowedTransitions.join(', ')}`
      );
    }

    // Specific role restrictions: Employees cannot change status to Resolved directly
    if (user.role === 'employee' && !['Closed', 'In Progress'].includes(newStatus)) {
      throw ApiError.forbidden('Employees may only close their own tickets or reopen closed tickets.');
    }

    // If reopening closed ticket
    if (currentStatus === 'Closed' && ['In Progress', 'Open'].includes(newStatus)) {
      ticket.reopenedAt = new Date();
      ticket.reopenCount = (ticket.reopenCount || 0) + 1;
    }

    // If resolving
    if (newStatus === 'Resolved') {
      ticket.sla.resolvedAt = new Date();
      if (resolutionNotes) {
        ticket.resolutionNotes = resolutionNotes;
      }
    }

    // If closing
    if (newStatus === 'Closed') {
      ticket.closedAt = new Date();
    }

    // First response tracking: if moving from Open to In Progress / Assigned by staff
    if (currentStatus === 'Open' && !ticket.sla.respondedAt && user.role !== 'employee') {
      ticket.sla.respondedAt = new Date();
    }

    ticket.status = newStatus;
    await ticket.save();

    // Record timeline event
    await TicketEvent.create({
      ticket: ticket._id,
      organization: ticket.organization,
      actor: user._id,
      eventType: newStatus === 'Resolved' ? 'RESOLVED' : newStatus === 'Closed' ? 'CLOSED' : 'STATUS_CHANGED',
      details: { from: currentStatus, to: newStatus, resolutionNotes },
      message: `Status updated from ${currentStatus} to ${newStatus} by ${user.name}${
        resolutionNotes ? `: "${resolutionNotes}"` : ''
      }`,
    });

    // Notify ticket creator if technician changed status
    if (ticket.creator && ticket.creator._id.toString() !== user._id.toString()) {
      await notificationService.createNotification({
        recipient: ticket.creator._id,
        organization: ticket.organization,
        title: `Ticket Status Updated: ${ticket.ticketNumber}`,
        message: `Your ticket "${ticket.title}" is now marked as ${newStatus}.`,
        type: 'STATUS_CHANGED',
        ticket: ticket._id,
      });
    }

    // Notify assignee if creator closed ticket
    if (ticket.assignee && ticket.assignee._id.toString() !== user._id.toString()) {
      await notificationService.createNotification({
        recipient: ticket.assignee._id,
        organization: ticket.organization,
        title: `Ticket Status Updated: ${ticket.ticketNumber}`,
        message: `Ticket "${ticket.title}" has been updated to ${newStatus} by ${user.name}.`,
        type: 'STATUS_CHANGED',
        ticket: ticket._id,
      });
    }

    await auditService.log({
      organization: ticket.organization,
      actor: user._id,
      action: 'TICKET_STATUS_CHANGED',
      resource: 'Ticket',
      resourceId: ticket._id,
      details: { from: currentStatus, to: newStatus },
      req,
    });

    broadcastTicketUpdate(ticket, ticketEvents.STATUS_CHANGED, { from: currentStatus, to: newStatus });

    return ticket;
  },

  reassignTicket: async (ticketId, assigneeId, user, req) => {
    // Only managers, admins, superadmins can directly reassign
    if (!['manager', 'admin', 'superadmin'].includes(user.role)) {
      throw ApiError.forbidden('Only managers and administrators can directly reassign tickets.');
    }

    const ticket = await Ticket.findOne({
      _id: ticketId,
      organization: user.organization?._id || user.organization,
    }).populate('assignee');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found');
    }

    const newAssignee = await User.findOne({
      _id: assigneeId,
      organization: ticket.organization,
      isActive: true,
    }).populate('team');

    if (!newAssignee) {
      throw ApiError.notFound('Target technician was not found in this organization.');
    }

    const previousAssigneeName = ticket.assignee ? ticket.assignee.name : 'Unassigned';
    ticket.assignee = newAssignee._id;
    ticket.team = newAssignee.team?._id || newAssignee.team || null;
    if (ticket.status === 'Open') {
      ticket.status = 'Assigned';
    }
    await ticket.save();

    await TicketEvent.create({
      ticket: ticket._id,
      organization: ticket.organization,
      actor: user._id,
      eventType: 'REASSIGNED',
      details: { from: previousAssigneeName, to: newAssignee.name },
      message: `Reassigned from ${previousAssigneeName} to ${newAssignee.name} by ${user.name}`,
    });

    // Notify new assignee
    await notificationService.createNotification({
      recipient: newAssignee._id,
      organization: ticket.organization,
      title: `Ticket Assigned: ${ticket.ticketNumber}`,
      message: `Ticket "${ticket.title}" has been reassigned to you by ${user.name}.`,
      type: 'TICKET_ASSIGNED',
      ticket: ticket._id,
    });

    await auditService.log({
      organization: ticket.organization,
      actor: user._id,
      action: 'TICKET_REASSIGNED',
      resource: 'Ticket',
      resourceId: ticket._id,
      details: { previousAssignee: previousAssigneeName, newAssignee: newAssignee.name },
      req,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('creator', 'name email role avatar')
      .populate('assignee', 'name email role avatar')
      .populate('team', 'name');

    broadcastTicketUpdate(populatedTicket, ticketEvents.ASSIGNED);

    return populatedTicket;
  },

  addComment: async (ticketId, { content, isInternal = false }, user, req) => {
    const orgId = user.organization?._id || user.organization;
    const ticketQuery = { _id: ticketId };
    if (orgId) ticketQuery.organization = orgId;

    if (user.role === 'employee') {
      ticketQuery.creator = user._id;
    } else if (user.role === 'technician') {
      ticketQuery.assignee = user._id;
    }

    const ticket = await Ticket.findOne(ticketQuery).populate('creator assignee');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found or you do not have permission to comment on it.');
    }

    // Employees cannot post internal notes
    const internal = user.role === 'employee' ? false : Boolean(isInternal);

    const comment = await TicketComment.create({
      ticket: ticket._id,
      author: user._id,
      organization: ticket.organization,
      content,
      isInternal: internal,
    });

    // Record timeline event
    await TicketEvent.create({
      ticket: ticket._id,
      organization: ticket.organization,
      actor: user._id,
      eventType: 'COMMENT_ADDED',
      details: { isInternal: internal },
      message: `${user.name} added a ${internal ? 'internal note' : 'comment'}`,
    });

    // If first response from staff to user, track respondedAt
    if (!ticket.sla.respondedAt && user.role !== 'employee') {
      ticket.sla.respondedAt = new Date();
      await ticket.save();
    }

    // If user commented on Pending User ticket, transition back to In Progress
    if (ticket.status === 'Pending User' && user._id.toString() === ticket.creator?._id.toString()) {
      ticket.status = 'In Progress';
      await ticket.save();
    }

    // Notify parties
    if (!internal) {
      if (ticket.assignee && ticket.assignee._id.toString() !== user._id.toString()) {
        await notificationService.createNotification({
          recipient: ticket.assignee._id,
          organization: ticket.organization,
          title: `New Comment: ${ticket.ticketNumber}`,
          message: `${user.name} commented on "${ticket.title}"`,
          type: 'NEW_COMMENT',
          ticket: ticket._id,
        });
      }

      if (ticket.creator && ticket.creator._id.toString() !== user._id.toString()) {
        await notificationService.createNotification({
          recipient: ticket.creator._id,
          organization: ticket.organization,
          title: `New Comment: ${ticket.ticketNumber}`,
          message: `${user.name} responded to your ticket "${ticket.title}"`,
          type: 'NEW_COMMENT',
          ticket: ticket._id,
        });
      }
    }

    const populatedComment = await TicketComment.findById(comment._id)
      .populate('author', 'name email role avatar');

    broadcastTicketUpdate(ticket, ticketEvents.COMMENT_ADDED, { comment: populatedComment });

    return populatedComment;
  },

  getTicketComments: async (ticketId, user) => {
    // 1. Verify ticket exists and belongs to user's organization with role scoping
    const orgId = user.organization?._id || user.organization;
    const ticketQuery = {
      _id: ticketId,
    };
    if (orgId) ticketQuery.organization = orgId;

    if (user.role === 'employee') {
      ticketQuery.creator = user._id;
    } else if (user.role === 'technician') {
      if (user.canViewTeamTickets && user.team) {
        const teamId = user.team._id || user.team;
        ticketQuery.$or = [
          { assignee: user._id },
          { team: teamId, ...(user.canViewUnassignedTeam ? {} : { assignee: user._id }) },
        ];
      } else {
        ticketQuery.assignee = user._id;
      }
    }

    const ticket = await Ticket.findOne(ticketQuery);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found or you do not have permission to view it.');
    }

    const query = {
      ticket: ticketId,
    };
    if (orgId) query.organization = orgId;

    // Employees cannot see internal notes
    if (user.role === 'employee') {
      query.isInternal = false;
    }

    return TicketComment.find(query)
      .populate('author', 'name email role avatar')
      .populate('attachments')
      .sort({ createdAt: 1 });
  },

  getTicketTimeline: async (ticketId, user) => {
    // 1. Verify ticket exists and belongs to user's organization with role scoping
    const orgId = user.organization?._id || user.organization;
    const ticketQuery = {
      _id: ticketId,
    };
    if (orgId) ticketQuery.organization = orgId;

    if (user.role === 'employee') {
      ticketQuery.creator = user._id;
    } else if (user.role === 'technician') {
      if (user.canViewTeamTickets && user.team) {
        const teamId = user.team._id || user.team;
        ticketQuery.$or = [
          { assignee: user._id },
          { team: teamId, ...(user.canViewUnassignedTeam ? {} : { assignee: user._id }) },
        ];
      } else {
        ticketQuery.assignee = user._id;
      }
    }

    const ticket = await Ticket.findOne(ticketQuery);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found or you do not have permission to view it.');
    }

    const query = { ticket: ticketId };
    if (orgId) query.organization = orgId;

    return TicketEvent.find(query)
      .populate('actor', 'name email role avatar')
      .sort({ createdAt: 1 });
  },
};
