'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../api/goal.api';
import type { CreateGoalInput } from '@/shared/types/api/goal';

export function useCreateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGoalInput) => goalApi.create(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
