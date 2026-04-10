'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export type CreateProjectInput = {
  name: string;
  description?: string;
};

export function useCreateProject(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateProjectInput) => {
      const name = input.name.trim();
      if (!name) throw new Error('Name is required');
      const description = input.description?.trim() || undefined;
      return projectApi.createProject({
        name,
        ...(description ? { description } : {}),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      options?.onSuccess?.();
    },
  });
}
