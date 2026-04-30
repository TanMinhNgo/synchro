'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { ProjectStatus } from '@/shared/types/api/project';
import { projectApi } from '../api/project.api';

export type UpdateProjectInput = {
  projectId: string;
  name?: string;
  description?: string;
  status?: ProjectStatus;
  memberIds?: string[];
};

export function useUpdateProject(options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProjectInput) => {
      const name = input.name?.trim();
      if (input.name !== undefined && !name) {
        throw new Error('Name is required');
      }
      const description = input.description?.trim();

      return projectApi.updateProject(input.projectId, {
        ...(name !== undefined ? { name } : {}),
        ...(description ? { description } : {}),
        ...(input.status ? { status: input.status } : {}),
        ...(input.memberIds ? { memberIds: input.memberIds } : {}),
      });
    },
    onSuccess: async (_data, input) => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      await queryClient.invalidateQueries({
        queryKey: ['projects', input.projectId],
      });
      options?.onSuccess?.();
    },
  });
}
