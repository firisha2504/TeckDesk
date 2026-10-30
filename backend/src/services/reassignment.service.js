import mongoose from 'mongoose';
import { ReassignmentRequest } from '../models/ReassignmentRequest.js';
import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { Team } from '../models/Team.js';
import { TicketEvent } from '../models/TicketEvent.js';
import { ApiError } from '../utils/ApiError.js';
import { notificationService } from './notification.service.js';
import { auditService } from './audit.service.js';
import { socketEmitter } from '../sockets/socketServer.js';
import { logger } from '../utils/logger.js';

export const reassignmentService = {
  /**
   * Helper to validate ObjectId format
   */
  _validateId: (id, name = 'ID') => {
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      throw ApiError.badRequest(`Invalid ${name} format.`);
    }
  },

  /**
   * Technician requests ticket reassignment
   */
  createRequest: async (ticketId, { targetTechnicianId, targetTeamId, reason }, user, req) => {
    reassignmentService._validateId(ticketId, 'Ticket ID');

    const orgId = user.organization?._id || user.organization;
    if (!orgId) {
      throw ApiError.forbidden('Organization context required.');
    }

    // 1. Fetch ticket and enforce tenant isolation
    const ticket = await Ticket.findOne({
      _id: ticketId,
      organization: orgId,
    }).populate('assignee team');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found in this organization.');
    }

    // 2. Security requirement: Only the currently assigned technician can request reassignment
    if (!ticket.assignee || ticket.assignee._id.toString() !== user._id.toString()) {
      throw ApiError.forbidden('Only the currently assigned technician can request reassignment.');
    }

    // 3. Security requirement: Prevent duplicate pending requests
    const existingPending = await ReassignmentRequest.findOne({
      ticket: ticket._id,
      status: 'pending',
    });
    if (existingPending) {
      throw ApiError.badRequest('A reassignment request is already pending for this ticket.');
    }

    // 4. Mandatory reason
    const trimmedReason = reason?.trim();
    if (!trimmedReason || trimmedReason.length < 3) {
      throw ApiError.badRequest('Reassignment reason is mandatory (minimum 3 characters).');
    }

    // 5. Target selection: at least one of targetTechnician or targetTeam
    if (!targetTechnicianId && !targetTeamId) {
      throw ApiError.badRequest('Please select an eligible target technician or team.');
    }

    let targetTech = null;
    let targetTeam = null;

    if (targetTechnicianId) {
      reassignmentService._validateId(targetTechnicianId, 'Target technician ID');
      if (targetTechnicianId.toString() === user._id.toString()) {
        throw ApiError.badRequest('Cannot request reassignment to yourself.');
      }

      // Security: Target technician must belong to the same organization
      targetTech = await User.findOne({
        _id: targetTechnicianId,
        organization: orgId,
        isActive: true,
      }).populate('team');

      if (!targetTech) {
        throw ApiError.badRequest('Target technician was not found in this organization.');
      }
    }

    if (targetTeamId) {
      reassignmentService._validateId(targetTeamId, 'Target team ID');
      targetTeam = await Team.findOne({
        _id: targetTeamId,
        organization: orgId,
        isActive: true,
      });

      if (!targetTeam) {
        throw ApiError.badRequest('Target team was not found in this organization.');
      }
    }

    // 6. Create the reassignment request record
    const request = await ReassignmentRequest.create({
      ticket: ticket._id,
      organization: orgId,
      originalTechnician: user._id,
      targetTechnician: targetTech ? targetTech._id : null,
      targetTeam: targetTeam ? targetTeam._id : null,
      reason: trimmedReason,
      status: 'pending',
    });

    // Link pending request on ticket
    ticket.pendingReassignment = request._id;
    await ticket.save();

    const targetDesc = targetTech
      ? `technician ${targetTech.name}`
      : targetTeam
      ? `team ${targetTeam.name}`
      : 'another specialist';

    // 7. Record ticket event timeline entry
    await TicketEvent.create({
      ticket: ticket._id,
      organization: orgId,
      actor: user._id,
      eventType: 'REASSIGNMENT_REQUESTED',
      details: {
        previousTechnician: { id: user._id, name: user.name },
        targetTechnician: targetTech ? { id: targetTech._id, name: targetTech.name } : null,
        targetTeam: targetTeam ? { id: targetTeam._id, name: targetTeam.name } : null,
        requestingTechnician: { id: user._id, name: user.name },
        reason: trimmedReason,
        date: new Date(),
      },
      message: `Reassignment requested by ${user.name} for ${targetDesc}. Reason: ${trimmedReason}`,
    });

    // 8. Notify relevant organization managers
    try {
      const managers = await User.find({
        organization: orgId,
        role: { $in: ['manager', 'admin'] },
        isActive: true,
      }).select('_id name email');

      for (const mgr of managers) {
        await notificationService.createNotification({
          recipient: mgr._id,
          organization: orgId,
          title: 'Ticket Reassignment Requested',
          message: `Technician ${user.name} requested reassignment for ticket #${ticket.ticketNumber} to ${targetDesc}: "${trimmedReason}"`,
          type: 'REASSIGNMENT_REQUESTED',
          ticket: ticket._id,
        });
      }
    } catch (notifErr) {
      logger.error('Failed to notify managers of reassignment request:', notifErr);
    }

    // 9. Real-time broadcast
    socketEmitter.emitToOrganization(orgId.toString(), 'reassignment:created', {
      requestId: request._id,
      ticketId: ticket._id,
    });
    socketEmitter.emitToTicket(ticket._id.toString(), 'ticket:updated', {
      ticket,
      pendingReassignment: request,
    });

    return ReassignmentRequest.findById(request._id)
      .populate('originalTechnician', 'name email role avatar skills')
      .populate('targetTechnician', 'name email role avatar skills')
      .populate('targetTeam', 'name specialties')
      .populate('ticket', 'ticketNumber title priority status category');
  },

  /**
   * List reassignment requests across the organization (for managers/admins)
   */
  listRequests: async ({ status, page = 1, limit = 20 } = {}, user) => {
    const orgId = user.organization?._id || user.organization;
    if (!orgId) {
      throw ApiError.forbidden('Organization context required.');
    }

    const query = { organization: orgId };
    if (status) {
      query.status = status;
    }

    // Non-managers may only query requests where they are the requesting technician
    if (!['manager', 'admin', 'superadmin'].includes(user.role)) {
      query.originalTechnician = user._id;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [requests, total, pendingCount] = await Promise.all([
      ReassignmentRequest.find(query)
        .populate('ticket', 'ticketNumber title priority status category')
        .populate('originalTechnician', 'name email role avatar skills')
        .populate('targetTechnician', 'name email role avatar skills')
        .populate('targetTeam', 'name specialties')
        .populate('reviewedBy', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      ReassignmentRequest.countDocuments(query),
      ReassignmentRequest.countDocuments({ organization: orgId, status: 'pending' }),
    ]);

    return {
      requests,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum) || 1,
      limit: limitNum,
      pendingCount,
    };
  },

  /**
   * View all reassignment requests and history for a specific ticket
   */
  getTicketRequests: async (ticketId, user) => {
    reassignmentService._validateId(ticketId, 'Ticket ID');
    const orgId = user.organization?._id || user.organization;

    // Check permission to view ticket with role-based scoping
    const ticketQuery = {
      _id: ticketId,
      organization: orgId,
    };
    if (user.role === 'employee') {
      ticketQuery.creator = user._id;
    } else if (user.role === 'technician') {
      ticketQuery.assignee = user._id;
    }

    const ticket = await Ticket.findOne(ticketQuery);
    if (!ticket) {
      throw ApiError.notFound('Ticket not found or you do not have permission to view it.');
    }

    return ReassignmentRequest.find({
      ticket: ticketId,
      organization: orgId,
    })
      .populate('originalTechnician', 'name email role avatar skills')
      .populate('targetTechnician', 'name email role avatar skills')
      .populate('targetTeam', 'name specialties')
      .populate('reviewedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();
  },

  /**
   * Cancel a pending reassignment request (technician cancels their own request)
   */
  cancelRequest: async (requestId, user, req) => {
    reassignmentService._validateId(requestId, 'Request ID');
    const orgId = user.organization?._id || user.organization;

    const request = await ReassignmentRequest.findOne({
      _id: requestId,
      organization: orgId,
    });

    if (!request) {
      throw ApiError.notFound('Reassignment request not found.');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest('Only pending reassignment requests can be cancelled.');
    }

    // Must be the requesting technician or a manager
    const isOwner = request.originalTechnician.toString() === user._id.toString();
    const isManager = ['manager', 'admin', 'superadmin'].includes(user.role);
    if (!isOwner && !isManager) {
      throw ApiError.forbidden('You are not authorized to cancel this reassignment request.');
    }

    request.status = 'cancelled';
    await request.save();

    // Clear pendingReassignment on ticket
    const ticket = await Ticket.findByIdAndUpdate(
      request.ticket,
      { $set: { pendingReassignment: null } },
      { new: true }
    ).populate('assignee creator team');

    // Record timeline event
    await TicketEvent.create({
      ticket: request.ticket,
      organization: orgId,
      actor: user._id,
      eventType: 'REASSIGNMENT_CANCELLED',
      details: {
        requestingTechnician: { id: user._id, name: user.name },
        date: new Date(),
        reason: request.reason,
      },
      message: `Reassignment request was cancelled by ${user.name}.`,
    });

    socketEmitter.emitToTicket(request.ticket.toString(), 'ticket:updated', {
      ticket,
      pendingReassignment: null,
    });

    return request;
  },

  /**
   * Manager approves a ticket reassignment request
   */
  approveRequest: async (requestId, user, req) => {
    reassignmentService._validateId(requestId, 'Request ID');
    const orgId = user.organization?._id || user.organization;

    // Security: Only authorized managers, admins or superadmins can approve requests
    if (!['manager', 'admin', 'superadmin'].includes(user.role)) {
      throw ApiError.forbidden('Access denied. Only authorized managers can approve reassignment requests.');
    }

    const request = await ReassignmentRequest.findOne({
      _id: requestId,
      organization: orgId,
    });

    if (!request) {
      throw ApiError.notFound('Reassignment request not found.');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest('This reassignment request is no longer pending.');
    }

    const ticket = await Ticket.findOne({
      _id: request.ticket,
      organization: orgId,
    }).populate('assignee team');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found.');
    }

    // Identify target technician and team
    let newAssignee = null;
    let newTeamId = request.targetTeam || null;

    if (request.targetTechnician) {
      newAssignee = await User.findOne({
        _id: request.targetTechnician,
        organization: orgId,
        isActive: true,
      }).populate('team');

      if (!newAssignee) {
        throw ApiError.badRequest('Target technician is no longer available in this organization.');
      }
      newTeamId = newAssignee.team?._id || newAssignee.team || newTeamId;
    } else if (request.targetTeam) {
      const targetTeam = await Team.findOne({
        _id: request.targetTeam,
        organization: orgId,
        isActive: true,
      });

      if (!targetTeam) {
        throw ApiError.badRequest('Target team was not found in this organization.');
      }

      // Pick active technician member from target team if available
      const candidateMembers = await User.find({
        team: targetTeam._id,
        organization: orgId,
        role: 'technician',
        isActive: true,
      });

      if (candidateMembers.length > 0) {
        newAssignee = candidateMembers[0];
      }
    }

    // Preserve previous technician information
    const previousAssignee = ticket.assignee;
    const previousTechName = previousAssignee ? previousAssignee.name : 'Unassigned';
    const previousTechId = previousAssignee?._id || request.originalTechnician;
    const newTechName = newAssignee ? newAssignee.name : 'Unassigned Team';

    // Update ticket assignment
    ticket.assignee = newAssignee ? newAssignee._id : null;
    if (newTeamId) {
      ticket.team = newTeamId;
    }
    ticket.pendingReassignment = null;
    if (ticket.status === 'Open' && newAssignee) {
      ticket.status = 'Assigned';
    }
    await ticket.save();

    // Update request state
    request.status = 'approved';
    request.reviewedBy = user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Record complete history in TicketEvent
    await TicketEvent.create({
      ticket: ticket._id,
      organization: orgId,
      actor: user._id,
      eventType: 'REASSIGNED',
      details: {
        previousTechnician: { id: previousTechId, name: previousTechName },
        newTechnician: newAssignee ? { id: newAssignee._id, name: newAssignee.name } : null,
        requestingTechnician: { id: request.originalTechnician, name: previousTechName },
        approvingManager: { id: user._id, name: user.name },
        reason: request.reason,
        date: new Date(),
        finalDecision: 'approved',
      },
      message: `Reassignment approved by ${user.name}. Reassigned from ${previousTechName} to ${newTechName}. Reason: ${request.reason}`,
    });

    // Notify parties
    try {
      // 1. Notify original technician
      await notificationService.createNotification({
        recipient: request.originalTechnician,
        organization: orgId,
        title: 'Reassignment Request Approved',
        message: `Your reassignment request for ticket #${ticket.ticketNumber} was approved by ${user.name}.`,
        type: 'REASSIGNMENT_APPROVED',
        ticket: ticket._id,
      });

      // 2. Notify new technician if assigned
      if (newAssignee && newAssignee._id.toString() !== request.originalTechnician.toString()) {
        await notificationService.createNotification({
          recipient: newAssignee._id,
          organization: orgId,
          title: 'Ticket Assigned to You',
          message: `You have been assigned ticket #${ticket.ticketNumber} (approved by ${user.name}).`,
          type: 'TICKET_ASSIGNED',
          ticket: ticket._id,
        });
      }

      // 3. Audit log
      await auditService.log({
        organization: orgId,
        actor: user._id,
        action: 'TICKET_REASSIGNMENT_APPROVED',
        resource: 'Ticket',
        resourceId: ticket._id,
        details: {
          requestId: request._id,
          previousTechnician: previousTechName,
          newTechnician: newTechName,
          reason: request.reason,
        },
        req,
      });
    } catch (notifErr) {
      logger.error('Failed to dispatch reassignment approval notifications:', notifErr);
    }

    // Real-time broadcasts
    socketEmitter.emitToOrganization(orgId.toString(), 'reassignment:updated', {
      requestId: request._id,
      status: 'approved',
    });
    socketEmitter.emitToTicket(ticket._id.toString(), 'ticket:updated', {
      ticket,
      pendingReassignment: null,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('creator', 'name email role avatar')
      .populate('assignee', 'name email role avatar skills')
      .populate('team', 'name specialties');

    return { ticket: populatedTicket, request };
  },

  /**
   * Manager rejects a ticket reassignment request
   */
  rejectRequest: async (requestId, { reason }, user, req) => {
    reassignmentService._validateId(requestId, 'Request ID');
    const orgId = user.organization?._id || user.organization;

    // Security: Only authorized managers, admins or superadmins can reject requests
    if (!['manager', 'admin', 'superadmin'].includes(user.role)) {
      throw ApiError.forbidden('Access denied. Only authorized managers can reject reassignment requests.');
    }

    const trimmedRejectionReason = reason?.trim();
    if (!trimmedRejectionReason || trimmedRejectionReason.length < 3) {
      throw ApiError.badRequest('Rejection reason is mandatory (minimum 3 characters).');
    }

    const request = await ReassignmentRequest.findOne({
      _id: requestId,
      organization: orgId,
    });

    if (!request) {
      throw ApiError.notFound('Reassignment request not found.');
    }

    if (request.status !== 'pending') {
      throw ApiError.badRequest('This reassignment request is no longer pending.');
    }

    const ticket = await Ticket.findOne({
      _id: request.ticket,
      organization: orgId,
    }).populate('assignee');

    if (!ticket) {
      throw ApiError.notFound('Ticket not found.');
    }

    // Keep ticket assignment UNCHANGED, clear pending flag
    ticket.pendingReassignment = null;
    await ticket.save();

    // Update request record with rejection details
    request.status = 'rejected';
    request.rejectionReason = trimmedRejectionReason;
    request.reviewedBy = user._id;
    request.reviewedAt = new Date();
    await request.save();

    // Record timeline history event
    await TicketEvent.create({
      ticket: ticket._id,
      organization: orgId,
      actor: user._id,
      eventType: 'REASSIGNMENT_REJECTED',
      details: {
        requestingTechnician: { id: request.originalTechnician },
        rejectingManager: { id: user._id, name: user.name },
        reason: request.reason,
        rejectionReason: trimmedRejectionReason,
        date: new Date(),
        finalDecision: 'rejected',
      },
      message: `Reassignment request rejected by ${user.name}. Rejection reason: "${trimmedRejectionReason}"`,
    });

    // Notify requesting technician
    try {
      await notificationService.createNotification({
        recipient: request.originalTechnician,
        organization: orgId,
        title: 'Reassignment Request Rejected',
        message: `Your reassignment request for ticket #${ticket.ticketNumber} was rejected by ${user.name}. Reason: "${trimmedRejectionReason}"`,
        type: 'REASSIGNMENT_REJECTED',
        ticket: ticket._id,
      });

      // Audit log
      await auditService.log({
        organization: orgId,
        actor: user._id,
        action: 'TICKET_REASSIGNMENT_REJECTED',
        resource: 'Ticket',
        resourceId: ticket._id,
        details: {
          requestId: request._id,
          rejectionReason: trimmedRejectionReason,
        },
        req,
      });
    } catch (notifErr) {
      logger.error('Failed to notify technician of reassignment rejection:', notifErr);
    }

    // Real-time broadcasts
    socketEmitter.emitToOrganization(orgId.toString(), 'reassignment:updated', {
      requestId: request._id,
      status: 'rejected',
    });
    socketEmitter.emitToTicket(ticket._id.toString(), 'ticket:updated', {
      ticket,
      pendingReassignment: null,
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('creator', 'name email role avatar')
      .populate('assignee', 'name email role avatar skills')
      .populate('team', 'name specialties');

    return { ticket: populatedTicket, request };
  },
};
