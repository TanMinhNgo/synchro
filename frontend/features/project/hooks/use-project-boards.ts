'use client';

import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export function useProjectBoards(
  projectId: string,
  options?: {
    enabled?: boolean;
    staleTime?: number;
  },
) {
  return useQuery({
    queryKey: ['projects', projectId, 'boards'],
    queryFn: () => projectApi.listBoards(projectId),
    enabled: options?.enabled ?? Boolean(projectId),
    ...(typeof options?.staleTime === 'number'
      ? { staleTime: options.staleTime }
      : {}),
  });
}
