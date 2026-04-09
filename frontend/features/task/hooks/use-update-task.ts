'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/features/task/api/task.api';
import type { Task } from '@/shared/types/api/task';

export type UpdateTaskInput = {
  taskId: string;
  title: string;
  description?: string;
  assigneeIds?: string[];
  dueDate?: string;
  priority: Task['priority'];
  subtasks: Array<{ id: string; title: string; isDone: boolean }>;
  attachments?: Array<{ url: string; title?: string }>;
};

export function useUpdateTask(options?: {
  listQueryKey?: readonly unknown[];
  updateList?: (prev: Task[] | undefined, updated: Task) => Task[];
  onSuccess?: (updated: Task) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateTaskInput) => {
      const title = input.title.trim();
      if (!title) throw new Error('Title is required');
      if (!input.taskId) throw new Error('Missing task');

      return taskApi.updateTask(input.taskId, {
        title,
        description: input.description?.trim() || undefined,
        priority: input.priority,
        ...(typeof input.assigneeIds !== 'undefined' ? { assigneeIds: input.assigneeIds } : {}),
        ...(input.dueDate ? { dueDate: input.dueDate } : {}),
        subtasks: input.subtasks,
        ...(input.attachments ? { attachments: input.attachments } : {}),
      });
    },
    onSuccess: (updated) => {
      const key = options?.listQueryKey;
      if (key) {
        const updateList =
          options?.updateList ??
          ((prev: Task[] | undefined, value: Task) => (prev ?? []).map((t) => (t.id === value.id ? value : t)));

        queryClient.setQueryData<Task[]>(key, (prev) => updateList(prev, updated));
        void queryClient.invalidateQueries({ queryKey: key });
      }
      options?.onSuccess?.(updated);
    },
  });
}
