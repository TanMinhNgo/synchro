'use client';

import { useMemo } from 'react';
import { useMyTasksKanban } from '@/features/task/hooks/useMyTasksKanban';
import type { Project } from '@/shared/types/api/project';

export type FavoriteProject = {
  projectId: string;
  name: string;
  href: string;
  interactions: number;
};

const EMPTY_PROJECTS: Project[] = [];

export function useFavoriteProjects(limit = 3) {
  const { items, projectsQuery, isLoading, isError } = useMyTasksKanban();

  const favorites = useMemo<FavoriteProject[]>(() => {
    const projects = projectsQuery.data ?? EMPTY_PROJECTS;
    const projectNameById = new Map(projects.map((p) => [p.id, p.name] as const));
    const projectSegmentById = new Map(
      projects.map((p) => [p.id, p.slug ?? p.id] as const),
    );

    const counts = new Map<string, number>();
    for (const item of items) {
      counts.set(item.projectId, (counts.get(item.projectId) ?? 0) + 1);
    }

    const ranked = Array.from(counts.entries())
      .map(([projectId, interactions]) => ({
        projectId,
        interactions,
        name: projectNameById.get(projectId) ?? items.find((i) => i.projectId === projectId)?.projectName ?? 'Project',
        href: `/projects/${projectSegmentById.get(projectId) ?? projectId}`,
      }))
      .sort((a, b) => b.interactions - a.interactions);

    if (ranked.length > 0) return ranked.slice(0, limit);

    // Fallback: if we have no interactions yet, show the first projects.
    return projects.slice(0, limit).map((p) => ({
      projectId: p.id,
      name: p.name,
      href: `/projects/${p.slug ?? p.id}`,
      interactions: 0,
    }));
  }, [items, limit, projectsQuery.data]);

  return {
    favorites,
    isLoading,
    isError,
  };
}
