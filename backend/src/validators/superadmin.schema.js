import { z } from 'zod';

export const updateOrganizationStatusSchema = z.object({
  status: z.enum(['active', 'pending', 'suspended', 'rejected', 'trial']),
  reason: z.string().max(500).optional(),
});

export const rejectOrganizationSchema = z.object({
  reason: z.string().min(1, 'A reason is required when rejecting an organization').max(500),
});

export const suspendOrganizationSchema = z.object({
  reason: z.string().min(1, 'A reason is required when suspending an organization').max(500),
});

export const updateOrganizationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  domain: z.string().max(255).optional().or(z.literal('')),
  plan: z.enum(['free', 'standard', 'enterprise']).optional(),
  status: z.enum(['active', 'pending', 'suspended', 'rejected', 'trial']).optional(),
  settings: z
    .object({
      allowRegistration: z.boolean().optional(),
      defaultTicketPriority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
      businessHours: z
        .object({
          start: z.string().optional(),
          end: z.string().optional(),
          timeZone: z.string().optional(),
        })
        .optional(),
    })
    .optional(),
});
