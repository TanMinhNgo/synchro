'use client';

import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export function useProjectMembers(
  projectId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  return useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectApi.listProjectMembers(projectId),
    enabled: options?.enabled ?? Boolean(projectId),
    ...(typeof options?.staleTime === 'number'
      ? { staleTime: options.staleTime }
      : {}),
  });
}
