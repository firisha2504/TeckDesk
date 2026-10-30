import mongoose from 'mongoose';

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [100, 'Organization name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    domain: {
      type: String,
      trim: true,
      lowercase: true,
    },
    logoUrl: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      default: 'Enterprise',
      trim: true,
    },
    officialEmail: {
      type: String,
      default: '',
      trim: true,
      lowercase: true,
    },
    phone: {
      type: String,
      default: '',
      trim: true,
    },
    address: {
      type: String,
      default: '',
      trim: true,
    },
    website: {
      type: String,
      default: '',
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'pending', 'suspended', 'rejected', 'trial'],
      default: 'pending',
      index: true,
    },
    plan: {
      type: String,
      enum: ['free', 'standard', 'enterprise'],
      default: 'standard',
    },
    settings: {
      allowRegistration: {
        type: Boolean,
        default: true,
      },
      defaultTicketPriority: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium',
      },
      businessHours: {
        start: { type: String, default: '09:00' },
        end: { type: String, default: '18:00' },
        timeZone: { type: String, default: 'UTC' },
      },
    },
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.model('Organization', organizationSchema);
