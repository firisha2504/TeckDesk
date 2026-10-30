import { socketEmitter } from './socketServer.js';

export const ticketEvents = {
  CREATED: 'ticket:created',
  UPDATED: 'ticket:updated',
  STATUS_CHANGED: 'ticket:status_changed',
  ASSIGNED: 'ticket:assigned',
  COMMENT_ADDED: 'ticket:comment_added',
  SLA_BREACHED: 'ticket:sla_breached',
  DELETED: 'ticket:deleted',
};

export const broadcastTicketUpdate = (ticket, eventType, extraData = {}) => {
  const orgId = ticket.organization?._id || ticket.organization;
  const ticketId = ticket._id.toString();

  const payload = {
    eventType,
    ticket,
    ...extraData,
    timestamp: new Date(),
  };

  // Broadcast to anyone currently viewing the specific ticket detail
  socketEmitter.emitToTicket(ticketId, eventType, payload);

  // Broadcast to managers and administrators (updates queues and dashboards)
  socketEmitter.emitToRole(orgId.toString(), 'manager', eventType, payload);
  socketEmitter.emitToRole(orgId.toString(), 'admin', eventType, payload);

  // If assigned, send direct event to technician
  if (ticket.assignee) {
    const assigneeId = ticket.assignee?._id || ticket.assignee;
    socketEmitter.emitToUser(assigneeId, eventType, payload);
  }

  // Send direct event to creator
  if (ticket.creator) {
    const creatorId = ticket.creator?._id || ticket.creator;
    socketEmitter.emitToUser(creatorId, eventType, payload);
  }
};
