'use client';

import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export function useProject(projectId: string) {
  return useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: Boolean(projectId),
  });
}
