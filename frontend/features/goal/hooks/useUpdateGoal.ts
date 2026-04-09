'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../api/goal.api';
import type { UpdateGoalInput } from '@/shared/types/api/goal';

export function useUpdateGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { goalId: string; input: UpdateGoalInput }) =>
      goalApi.update(params.goalId, params.input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
