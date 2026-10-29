import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  avatar: z.string().optional(),
  skills: z.array(z.string()).optional(),
  currentPassword: z.string().optional(),
  newPassword: z.string().min(6).optional(),
});

export const updateUserRoleSchema = z.object({
  role: z.enum(['employee', 'technician', 'manager', 'admin']).optional(),
  teamId: z.string().nullable().optional(),
  isActive: z.boolean().optional(),
  skills: z.array(z.string()).optional(),
});

export const createTeamSchema = z.object({
  name: z.string().min(2).max(100),
  leadId: z.string().optional().nullable(),
  memberIds: z.array(z.string()).optional(),
  specialties: z.array(z.string()).optional(),
});

export const updateSLAPolicySchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  priorities: z.object({
    Critical: z.object({ responseTimeMinutes: z.number(), resolutionTimeMinutes: z.number() }).optional(),
    High: z.object({ responseTimeMinutes: z.number(), resolutionTimeMinutes: z.number() }).optional(),
    Medium: z.object({ responseTimeMinutes: z.number(), resolutionTimeMinutes: z.number() }).optional(),
    Low: z.object({ responseTimeMinutes: z.number(), resolutionTimeMinutes: z.number() }).optional(),
  }).optional(),
  escalationEmail: z.string().email().optional().or(z.literal('')),
});
