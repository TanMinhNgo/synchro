'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '../api/project.api';
import { taskApi } from '@/features/task/api/task.api';

export function useProjectBoardData(projectId: string) {
  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: Boolean(projectId),
  });

  const boardsQuery = useQuery({
    queryKey: ['projects', projectId, 'boards'],
    queryFn: () => projectApi.listBoards(projectId),
    enabled: Boolean(projectId),
  });

  const boardId = useMemo(() => {
    const boards = boardsQuery.data;
    return boards && boards.length > 0 ? boards[0]!.id : undefined;
  }, [boardsQuery.data]);

  const columnsQuery = useQuery({
    queryKey: ['projects', projectId, 'boards', boardId, 'columns'],
    queryFn: () => projectApi.listColumns(projectId, boardId!),
    enabled: Boolean(projectId && boardId),
  });

  const tasksQuery = useQuery({
    queryKey: ['projects', projectId, 'boards', boardId, 'tasks'],
    queryFn: () => taskApi.listTasksByProject({ projectId, boardId }),
    enabled: Boolean(projectId && boardId),
  });

  return {
    projectQuery,
    boardsQuery,
    boardId,
    columnsQuery,
    tasksQuery,
  };
}
