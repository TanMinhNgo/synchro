import { z } from 'zod';

export const ProjectSchema = z.object({
  id: z.string(),
  name: z.string().min(3, 'Project name must be at least 3 characters'),
  description: z.string().optional(),
  ownerId: z.string().uuid(),
  status: z.enum(['active', 'archived', 'completed']).default('active'),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type Project = z.infer<typeof ProjectSchema>;

export const CreateProjectSchema = ProjectSchema.pick({
  name: true,
  description: true,
});

export type CreateProjectAction = z.infer<typeof CreateProjectSchema>;
