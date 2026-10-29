import mongoose from 'mongoose';

const ticketSchema = new mongoose.Schema(
  {
    ticketNumber: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Ticket title is required'],
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      required: [true, 'Ticket description is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['Hardware', 'Software', 'Network', 'Account', 'Security', 'Other'],
      default: 'Software',
      index: true,
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
      index: true,
    },
    status: {
      type: String,
      enum: ['Open', 'Assigned', 'In Progress', 'Pending User', 'Resolved', 'Closed'],
      default: 'Open',
      index: true,
    },
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assignee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    attachments: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Attachment',
      },
    ],
    slaPolicy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SLAPolicy',
    },
    sla: {
      responseDeadline: { type: Date },
      respondedAt: { type: Date },
      isResponseBreached: { type: Boolean, default: false },
      resolutionDeadline: { type: Date },
      resolvedAt: { type: Date },
      isResolutionBreached: { type: Boolean, default: false },
      escalated: { type: Boolean, default: false },
      escalatedAt: { type: Date },
      escalationReason: { type: String, default: '' },
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    closedAt: {
      type: Date,
    },
    reopenedAt: {
      type: Date,
    },
    reopenCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for optimized querying
ticketSchema.index({ organization: 1, status: 1 });
ticketSchema.index({ organization: 1, priority: 1 });
ticketSchema.index({ organization: 1, assignee: 1 });
ticketSchema.index({ organization: 1, creator: 1 });
ticketSchema.index({ organization: 1, createdAt: -1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
