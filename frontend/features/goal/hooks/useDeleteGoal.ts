'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { goalApi } from '../api/goal.api';

export function useDeleteGoal() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { goalId: string }) =>
      goalApi.remove(params.goalId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
    },
  });
}
