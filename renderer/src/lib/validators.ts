import { z } from 'zod';

export const todoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Max 200 characters'),
  description: z.string().max(2000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  status: z.enum(['pending', 'in_progress', 'completed']),
  category_id: z.number().nullable().optional(),
  due_date: z.string().optional(),
  due_time: z.string().optional(),
});

export type TodoSchema = z.infer<typeof todoSchema>;

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid color'),
});

export type CategorySchema = z.infer<typeof categorySchema>;
