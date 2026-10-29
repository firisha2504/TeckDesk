import mongoose from 'mongoose';

const slaPolicySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    isDefault: {
      type: Boolean,
      default: false,
    },
    priorities: {
      Critical: {
        responseTimeMinutes: { type: Number, default: 15 },
        resolutionTimeMinutes: { type: Number, default: 120 },
      },
      High: {
        responseTimeMinutes: { type: Number, default: 60 },
        resolutionTimeMinutes: { type: Number, default: 480 },
      },
      Medium: {
        responseTimeMinutes: { type: Number, default: 240 },
        resolutionTimeMinutes: { type: Number, default: 1440 },
      },
      Low: {
        responseTimeMinutes: { type: Number, default: 480 },
        resolutionTimeMinutes: { type: Number, default: 2880 },
      },
    },
    escalationEmail: {
      type: String,
      default: '',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

export const SLAPolicy = mongoose.model('SLAPolicy', slaPolicySchema);
