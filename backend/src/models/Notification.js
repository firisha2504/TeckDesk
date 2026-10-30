import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: [
        'TICKET_CREATED',
        'TICKET_ASSIGNED',
        'STATUS_CHANGED',
        'NEW_COMMENT',
        'SLA_WARNING',
        'SLA_BREACH',
        'ESCALATION',
        'SYSTEM',
        'REASSIGNMENT_REQUESTED',
        'REASSIGNMENT_APPROVED',
        'REASSIGNMENT_REJECTED',
        'REASSIGNMENT_CANCELLED',
      ],
      default: 'SYSTEM',
    },
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      default: null,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

export const Notification = mongoose.model('Notification', notificationSchema);
