import { Ticket } from '../models/Ticket.js';
import { User } from '../models/User.js';
import { TicketEvent } from '../models/TicketEvent.js';
import { notificationService } from '../services/notification.service.js';
import { broadcastTicketUpdate, ticketEvents } from '../sockets/ticket.socket.js';
import { logger } from '../utils/logger.js';

/**
 * Automatically escalates Critical tickets that have been unresolved for over 2 hours
 */
export const runEscalationJob = async () => {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);

    const candidates = await Ticket.find({
      priority: 'Critical',
      status: { $in: ['Open', 'Assigned', 'In Progress'] },
      'sla.escalated': false,
      createdAt: { $lt: twoHoursAgo },
    }).populate('assignee creator');

    for (const ticket of candidates) {
      ticket.sla.escalated = true;
      ticket.sla.escalatedAt = new Date();
      ticket.sla.escalationReason = 'Automatic escalation: Critical ticket unresolved for over 2 hours';
      await ticket.save();

      await TicketEvent.create({
        ticket: ticket._id,
        organization: ticket.organization,
        actor: null,
        eventType: 'ESCALATED',
        details: { reason: ticket.sla.escalationReason },
        message: 'System Escalation: Critical ticket exceeded resolution threshold.',
      });

      const managers = await User.find({
        organization: ticket.organization,
        role: { $in: ['manager', 'admin'] },
        isActive: true,
      });

      for (const mgr of managers) {
        await notificationService.createNotification({
          recipient: mgr._id,
          organization: ticket.organization,
          title: `Critical Escalation Alert: ${ticket.ticketNumber}`,
          message: `Ticket "${ticket.title}" auto-escalated to management review.`,
          type: 'ESCALATION',
          ticket: ticket._id,
        });
      }

      broadcastTicketUpdate(ticket, ticketEvents.UPDATED, { escalated: true });
    }
  } catch (error) {
    logger.error('Error running escalation job:', error);
  }
};
