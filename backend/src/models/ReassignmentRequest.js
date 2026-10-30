import mongoose from 'mongoose';

const reassignmentRequestSchema = new mongoose.Schema(
  {
    ticket: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Ticket',
      required: [true, 'Ticket reference is required'],
      index: true,
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: [true, 'Organization is required'],
      index: true,
    },
    originalTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Original technician is required'],
      index: true,
    },
    targetTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    targetTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team',
      default: null,
      index: true,
    },
    reason: {
      type: String,
      required: [true, 'Reassignment reason is mandatory'],
      trim: true,
      minlength: [3, 'Reason must be at least 3 characters'],
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled'],
      default: 'pending',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: '',
      trim: true,
      maxlength: [1000, 'Rejection reason cannot exceed 1000 characters'],
    },
  },
  {
    timestamps: true,
  }
);

reassignmentRequestSchema.index({ organization: 1, status: 1 });
reassignmentRequestSchema.index({ ticket: 1, status: 1 });
reassignmentRequestSchema.index({ originalTechnician: 1, status: 1 });

export const ReassignmentRequest = mongoose.model(
  'ReassignmentRequest',
  reassignmentRequestSchema
);
