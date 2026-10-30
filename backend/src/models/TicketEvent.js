import mongoose from 'mongoose';

const ticketEventSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    eventType: {
      type: String,
      enum: [
        'CREATED',
        'ASSIGNED',
        'REASSIGNED',
        'STATUS_CHANGED',
        'PRIORITY_CHANGED',
        'COMMENT_ADDED',
        'ATTACHMENT_ADDED',
        'SLA_BREACH',
        'ESCALATED',
        'RESOLVED',
        'CLOSED',
        'REOPENED',
        'REASSIGNMENT_REQUESTED',
        'REASSIGNMENT_APPROVED',
        'REASSIGNMENT_REJECTED',
        'REASSIGNMENT_CANCELLED',
      ],
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    message: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export const TicketEvent = mongoose.model('TicketEvent', ticketEventSchema);
