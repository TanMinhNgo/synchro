'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export function useInviteProjectMember(projectId: string, options?: { onSuccess?: () => void }) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { email: string }) => {
      const email = input.email.trim();
      if (!email) throw new Error('Email is required');
      await projectApi.inviteMember(projectId, email);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'members'] });
      options?.onSuccess?.();
    },
  });
}
