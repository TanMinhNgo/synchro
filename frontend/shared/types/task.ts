import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  projectId: z.string().uuid(),
  status: z.enum(['todo', 'in-progress', 'in-review', 'done']).default('todo'),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  assigneeId: z.string().optional().nullable(),
  dueDate: z.string().datetime().optional().nullable(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Task = z.infer<typeof TaskSchema>;

export const CreateTaskSchema = TaskSchema.pick({
  title: true,
  description: true,
  projectId: true,
  status: true,
  priority: true,
  assigneeId: true,
  dueDate: true,
}).partial({
  status: true,
  priority: true,
});

export type CreateTaskAction = z.infer<typeof CreateTaskSchema>;
