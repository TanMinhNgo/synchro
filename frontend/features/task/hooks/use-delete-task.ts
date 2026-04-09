'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/features/task/api/task.api';
import type { Task } from '@/shared/types/api/task';

export function useDeleteTask(options?: {
  listQueryKey?: readonly unknown[];
  onSuccess?: (deletedTaskId: string) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (taskId: string) => {
      if (!taskId) throw new Error('Missing task');
      await taskApi.deleteTask(taskId);
      return taskId;
    },
    onSuccess: (deletedTaskId) => {
      const key = options?.listQueryKey;
      if (key) {
        queryClient.setQueryData<Task[]>(key, (prev) => (prev ?? []).filter((t) => t.id !== deletedTaskId));
        void queryClient.invalidateQueries({ queryKey: key });
      }
      options?.onSuccess?.(deletedTaskId);
    },
  });
}
