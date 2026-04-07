'use client';

import { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { useCurrentUser } from '@/features/auth';
import { useProjects } from '@/features/project';
import { taskApi } from '@/features/task/api/task.api';
import type { Project, ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';

const EMPTY_PROJECTS: Project[] = [];

export type MyTaskItem = {
  task: Task;
  projectId: string;
  projectName: string;
};

export function useMyTasksKanban() {
  const currentUserQuery = useCurrentUser();
  const projectsQuery = useProjects();

  const userId = currentUserQuery.data?.id;
  const projects = projectsQuery.data;
  const projectList = projects ?? EMPTY_PROJECTS;

  const taskQueries = useQueries({
    queries: projectList.map((project) => ({
      queryKey: ['projects', project.id, 'tasks', 'assignee', userId],
      queryFn: () =>
        taskApi.listTasksByProject({
          projectId: project.id,
          assigneeId: userId,
        }),
      enabled: Boolean(userId && project.id),
      staleTime: 10_000,
    })),
  });

  const isLoading =
    currentUserQuery.isLoading ||
    projectsQuery.isLoading ||
    taskQueries.some((q) => q.isLoading);

  const isError =
    currentUserQuery.isError ||
    projectsQuery.isError ||
    taskQueries.some((q) => q.isError);

  const items = useMemo<MyTaskItem[]>(() => {
    if (!userId || projectList.length === 0) return [];

    const projectNameById = new Map(projectList.map((p) => [p.id, p.name] as const));

    const merged: MyTaskItem[] = [];
    for (let i = 0; i < taskQueries.length; i++) {
      const q = taskQueries[i];
      const project = projectList[i];
      if (!project) continue;
      const tasks = q.data ?? [];
      const projectName = projectNameById.get(project.id) ?? project.name;

      for (const task of tasks) {
        merged.push({
          task,
          projectId: project.id,
          projectName,
        });
      }
    }

    merged.sort((a, b) => {
      const at = a.task.createdAt ? Date.parse(a.task.createdAt) : 0;
      const bt = b.task.createdAt ? Date.parse(b.task.createdAt) : 0;
      return bt - at;
    });

    return merged;
  }, [userId, projectList, taskQueries]);

  const tasksByColumnKey = useMemo(() => {
    const map: Partial<Record<ProjectColumnKey, MyTaskItem[]>> = {};
    for (const item of items) {
      const key = item.task.columnKey;
      (map[key] ??= []).push(item);
    }
    return map;
  }, [items]);

  return {
    currentUserQuery,
    projectsQuery,
    taskQueries,
    isLoading,
    isError,
    items,
    tasksByColumnKey,
  };
}
