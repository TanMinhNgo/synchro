'use client';

import { useQuery } from '@tanstack/react-query';
import { goalApi } from '../api/goal.api';

export function useGoals() {
  return useQuery({
    queryKey: ['goals'],
    queryFn: () => goalApi.list(),
  });
}
