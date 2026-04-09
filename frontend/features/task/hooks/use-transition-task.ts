'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/features/task/api/task.api';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';

export type TransitionTaskInput = {
  taskId: string;
  nextColumnKey: ProjectColumnKey;
  projectId?: string;
};

export function useTransitionTask(options: {
  listQueryKey?: readonly unknown[];
  getListQueryKey?: (vars: TransitionTaskInput) => readonly unknown[] | undefined;
  onSuccess?: () => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vars: TransitionTaskInput) =>
      taskApi.transitionTask(vars.taskId, { columnKey: vars.nextColumnKey }),
    onMutate: async (vars) => {
      const key = options.getListQueryKey ? options.getListQueryKey(vars) : options.listQueryKey;
      if (!key) return { previous: undefined as Task[] | undefined };
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<Task[]>(key);
      queryClient.setQueryData<Task[]>(key, (prev) =>
        (prev ?? []).map((t) => (t.id === vars.taskId ? { ...t, columnKey: vars.nextColumnKey } : t)),
      );
      return { previous, key };
    },
    onError: (_err, _vars, ctx) => {
      const key = ctx?.key ?? options.listQueryKey;
      if (!key) return;
      if (ctx?.previous) queryClient.setQueryData(key, ctx.previous);
    },
    onSettled: (_data, _error, vars, ctx) => {
      const key =
        ctx?.key ??
        (options.getListQueryKey ? options.getListQueryKey(vars) : options.listQueryKey);
      if (key) void queryClient.invalidateQueries({ queryKey: key });
      options.onSuccess?.();
    },
  });
}
