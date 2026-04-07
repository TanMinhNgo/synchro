'use client';

import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.listProjects(),
  });
}
