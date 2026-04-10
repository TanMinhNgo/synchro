'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi } from '@/features/task/api/task.api';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';

export type CreateTaskInput = {
  projectId: string;
  boardId: string;
  columnKey: ProjectColumnKey;
  title: string;
  description?: string;
  assigneeIds?: string[];
  dueDate?: string;
  priority: Task['priority'];
  subtasks?: Array<{ title: string; isDone: boolean }>;
  attachments?: Array<{ url: string; title?: string }>;
};

export function useCreateTask(options?: {
  listQueryKey?: readonly unknown[];
  shouldAddToList?: (created: Task) => boolean;
  onSuccess?: (created: Task) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateTaskInput) => {
      const title = input.title.trim();
      if (!title) throw new Error('Title is required');
      if (!input.projectId) throw new Error('Missing project');
      if (!input.boardId) throw new Error('Missing board');

      return taskApi.createTask(input.projectId, {
        boardId: input.boardId,
        columnKey: input.columnKey,
        title,
        description: input.description?.trim() || undefined,
        priority: input.priority,
        ...(input.assigneeIds ? { assigneeIds: input.assigneeIds } : {}),
        ...(input.dueDate ? { dueDate: input.dueDate } : {}),
        ...(input.subtasks && input.subtasks.length > 0
          ? { subtasks: input.subtasks }
          : {}),
        ...(input.attachments && input.attachments.length > 0
          ? { attachments: input.attachments }
          : {}),
      });
    },
    onSuccess: (created) => {
      const key = options?.listQueryKey;
      const shouldAdd = options?.shouldAddToList ?? (() => true);
      if (key && shouldAdd(created)) {
        queryClient.setQueryData<Task[]>(key, (prev) => [
          created,
          ...(prev ?? []),
        ]);
        void queryClient.invalidateQueries({ queryKey: key });
      }
      options?.onSuccess?.(created);
    },
  });
}
