import { SLAPolicy } from '../models/SLAPolicy.js';
import { Ticket } from '../models/Ticket.js';
import { TicketEvent } from '../models/TicketEvent.js';
import { User } from '../models/User.js';
import { notificationService } from './notification.service.js';
import { broadcastTicketUpdate, ticketEvents } from '../sockets/ticket.socket.js';
import { logger } from '../utils/logger.js';

const DEFAULT_SLA_MINUTES = {
  Critical: { response: 15, resolution: 120 },
  High: { response: 60, resolution: 480 },
  Medium: { response: 240, resolution: 1440 },
  Low: { response: 480, resolution: 2880 },
};

export const slaService = {
  calculateDeadlines: async (priority, organizationId) => {
    let policy = await SLAPolicy.findOne({ organization: organizationId, isActive: true });
    if (!policy) {
      policy = await SLAPolicy.findOne({ isDefault: true });
    }

    const priorityConfig = policy?.priorities?.[priority] || {
      responseTimeMinutes: DEFAULT_SLA_MINUTES[priority]?.response || 240,
      resolutionTimeMinutes: DEFAULT_SLA_MINUTES[priority]?.resolution || 1440,
    };

    const now = new Date();
    const responseDeadline = new Date(now.getTime() + priorityConfig.responseTimeMinutes * 60 * 1000);
    const resolutionDeadline = new Date(now.getTime() + priorityConfig.resolutionTimeMinutes * 60 * 1000);

    return {
      policyId: policy?._id || null,
      responseDeadline,
      resolutionDeadline,
      responseTimeMinutes: priorityConfig.responseTimeMinutes,
      resolutionTimeMinutes: priorityConfig.resolutionTimeMinutes,
    };
  },

  checkAndApplyBreaches: async (organizationId = null) => {
    try {
      const now = new Date();
      const filter = {
        status: { $nin: ['Resolved', 'Closed'] },
        $or: [
          { 'sla.resolutionDeadline': { $lt: now }, 'sla.isResolutionBreached': false },
          { 'sla.responseDeadline': { $lt: now }, 'sla.isResponseBreached': false, status: 'Open' },
        ],
      };

      if (organizationId) {
        filter.organization = organizationId;
      }

      const overdueTickets = await Ticket.find(filter)
        .populate('assignee', 'name email role')
        .populate('creator', 'name email');

      logger.info(`SLA Monitor: Found ${overdueTickets.length} tickets with active breaches.`);

      for (const ticket of overdueTickets) {
        let isBreached = false;
        let breachReason = '';

        if (ticket.status === 'Open' && ticket.sla.responseDeadline < now && !ticket.sla.isResponseBreached) {
          ticket.sla.isResponseBreached = true;
          isBreached = true;
          breachReason = 'First response SLA deadline exceeded';
        }

        if (ticket.sla.resolutionDeadline < now && !ticket.sla.isResolutionBreached) {
          ticket.sla.isResolutionBreached = true;
          isBreached = true;
          breachReason = 'Resolution SLA deadline exceeded';
        }

        if (isBreached) {
          // If critical and breached, mark escalated automatically
          if (ticket.priority === 'Critical' && !ticket.sla.escalated) {
            ticket.sla.escalated = true;
            ticket.sla.escalatedAt = now;
            ticket.sla.escalationReason = `Auto-escalated: ${breachReason}`;
          }

          await ticket.save();

          // Log timeline event
          await TicketEvent.create({
            ticket: ticket._id,
            organization: ticket.organization,
            actor: null,
            eventType: 'SLA_BREACH',
            details: { reason: breachReason, at: now },
            message: `SLA Alert: ${breachReason}`,
          });

          // Notify Assignee
          if (ticket.assignee) {
            await notificationService.createNotification({
              recipient: ticket.assignee._id,
              organization: ticket.organization,
              title: `SLA Breach Alert: ${ticket.ticketNumber}`,
              message: `Ticket "${ticket.title}" has breached its SLA deadline. Immediate action required.`,
              type: 'SLA_BREACH',
              ticket: ticket._id,
            });
          }

          // Notify Organization Managers
          const managers = await User.find({
            organization: ticket.organization,
            role: { $in: ['manager', 'admin'] },
            isActive: true,
          }).select('_id');

          for (const mgr of managers) {
            await notificationService.createNotification({
              recipient: mgr._id,
              organization: ticket.organization,
              title: `SLA Breach Escalation: ${ticket.ticketNumber}`,
              message: `Ticket "${ticket.title}" (${ticket.priority}) breached SLA. Assignee: ${
                ticket.assignee ? ticket.assignee.name : 'Unassigned'
              }`,
              type: 'ESCALATION',
              ticket: ticket._id,
            });
          }

          // Broadcast real-time update
          broadcastTicketUpdate(ticket, ticketEvents.SLA_BREACHED, { breachReason });
        }
      }

      return overdueTickets.length;
    } catch (error) {
      logger.error('Error checking SLA breaches:', error);
      return 0;
    }
  },

  escalateTicket: async (ticketId, reason, actorUser) => {
    const ticket = await Ticket.findById(ticketId).populate('assignee creator');
    if (!ticket) throw new Error('Ticket not found');

    ticket.sla.escalated = true;
    ticket.sla.escalatedAt = new Date();
    ticket.sla.escalationReason = reason || 'Manual escalation requested';
    await ticket.save();

    await TicketEvent.create({
      ticket: ticket._id,
      organization: ticket.organization,
      actor: actorUser._id,
      eventType: 'ESCALATED',
      details: { reason },
      message: `Ticket manually escalated by ${actorUser.name}: ${reason}`,
    });

    // Notify managers
    const managers = await User.find({
      organization: ticket.organization,
      role: { $in: ['manager', 'admin'] },
      isActive: true,
    });

    for (const mgr of managers) {
      await notificationService.createNotification({
        recipient: mgr._id,
        organization: ticket.organization,
        title: `Manual Escalation: ${ticket.ticketNumber}`,
        message: `${actorUser.name} escalated ticket "${ticket.title}": ${reason}`,
        type: 'ESCALATION',
        ticket: ticket._id,
      });
    }

    broadcastTicketUpdate(ticket, ticketEvents.UPDATED, { escalated: true });
    return ticket;
  },
};
