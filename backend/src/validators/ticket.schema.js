import { z } from 'zod';

export const createTicketSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().min(5, 'Description must be at least 5 characters'),
  category: z.enum(['Hardware', 'Software', 'Network', 'Account', 'Security', 'Other']).default('Software'),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).default('Medium'),
});

export const updateTicketSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  description: z.string().min(5).optional(),
  category: z.enum(['Hardware', 'Software', 'Network', 'Account', 'Security', 'Other']).optional(),
  priority: z.enum(['Low', 'Medium', 'High', 'Critical']).optional(),
  status: z.enum(['Open', 'Assigned', 'In Progress', 'Pending User', 'Resolved', 'Closed']).optional(),
});

export const changeStatusSchema = z.object({
  status: z.enum(['Open', 'Assigned', 'In Progress', 'Pending User', 'Resolved', 'Closed']),
  resolutionNotes: z.string().optional(),
});

export const reassignSchema = z.object({
  assigneeId: z.string().min(1, 'Assignee ID is required'),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment text cannot be empty'),
  isInternal: z.boolean().optional().default(false),
});
