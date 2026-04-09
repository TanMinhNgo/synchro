'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';
import type { ProjectColumnKey } from '@/shared/types/api/project';

const DEFAULT_COLUMNS: Array<{ key: ProjectColumnKey; name: string }> = [
  { key: 'backlog', name: 'Backlog' },
  { key: 'in_progress', name: 'In Progress' },
  { key: 'in_review', name: 'In Review' },
  { key: 'done', name: 'Done' },
];

export function useCreateDefaultColumns(projectId: string, boardId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!projectId) throw new Error('Missing project');
      if (!boardId) throw new Error('Missing board');

      for (let i = 0; i < DEFAULT_COLUMNS.length; i += 1) {
        const col = DEFAULT_COLUMNS[i]!;
        await projectApi.createColumn(projectId, boardId, {
          key: col.key,
          name: col.name,
          order: i,
        });
      }
    },
    onSuccess: async () => {
      if (!boardId) return;
      await queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'boards', boardId, 'columns'],
      });
    },
  });
}
