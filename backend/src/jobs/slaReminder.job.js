import { Ticket } from '../models/Ticket.js';
import { notificationService } from '../services/notification.service.js';
import { logger } from '../utils/logger.js';

/**
 * Sends warning notifications for tickets approaching SLA deadline within 30 minutes
 */
export const runSlaReminderJob = async () => {
  try {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    const approachingTickets = await Ticket.find({
      status: { $in: ['Assigned', 'In Progress'] },
      'sla.resolutionDeadline': { $gt: now, $lte: thirtyMinutesFromNow },
      'sla.isResolutionBreached': false,
    }).populate('assignee', 'name email');

    logger.debug(`Found ${approachingTickets.length} tickets approaching SLA deadline.`);

    for (const ticket of approachingTickets) {
      if (ticket.assignee) {
        await notificationService.createNotification({
          recipient: ticket.assignee._id,
          organization: ticket.organization,
          title: `SLA Warning: ${ticket.ticketNumber}`,
          message: `Ticket "${ticket.title}" resolution deadline is in less than 30 minutes!`,
          type: 'SLA_WARNING',
          ticket: ticket._id,
        });
      }
    }
  } catch (error) {
    logger.error('Error in SLA reminder job:', error);
  }
};
