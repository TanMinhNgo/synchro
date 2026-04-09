"use client";

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { useMyTasksKanban } from '@/features/task/hooks/useMyTasksKanban';

export default function PortfolioPage() {
  const { isLoading, isError, items, projectsQuery, taskQueries, currentUserQuery } = useMyTasksKanban();

  const projects = React.useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

  const now = React.useMemo(() => new Date(), []);

  const metricsByProjectId = React.useMemo(() => {
    const map = new Map<string, { total: number; open: number; done: number; overdue: number }>();

    for (const item of items) {
      const entry = map.get(item.projectId) ?? { total: 0, open: 0, done: 0, overdue: 0 };
      entry.total++;

      if (item.task.columnKey === 'done') {
        entry.done++;
      } else {
        entry.open++;
        if (item.task.dueDate) {
          const due = new Date(item.task.dueDate);
          if (!Number.isNaN(due.getTime()) && due < now) entry.overdue++;
        }
      }

      map.set(item.projectId, entry);
    }

    return map;
  }, [items, now]);

  const errorMessage =
    (currentUserQuery.error as Error | undefined)?.message ??
    (projectsQuery.error as Error | undefined)?.message ??
    (taskQueries.find((q) => q.isError)?.error as Error | undefined)?.message;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Portfolio</h1>
        <p className="text-muted-foreground">Browse your workspaces and collections.</p>
      </div>

      {isError && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Failed to load portfolio</CardTitle>
            <CardDescription>{errorMessage ?? 'Unknown error'}</CardDescription>
          </CardHeader>
        </Card>
      )}

      {!isLoading && projects.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No projects yet</EmptyTitle>
            <EmptyDescription>Create a project to start organizing work.</EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        {isLoading && (
          <>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loading…</CardTitle>
                <CardDescription>Fetching project data.</CardDescription>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Loading…</CardTitle>
                <CardDescription>Fetching project data.</CardDescription>
              </CardHeader>
            </Card>
          </>
        )}

        {!isLoading &&
          projects.map((p) => {
            const m = metricsByProjectId.get(p.id) ?? { total: 0, open: 0, done: 0, overdue: 0 };

            return (
              <Card key={p.id}>
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{p.name}</CardTitle>
                      <CardDescription className="mt-1">{p.description ?? '—'}</CardDescription>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link href={`/projects/${p.slug ?? p.id}`}>Open</Link>
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Badge variant="outline">My tasks: {m.total}</Badge>
                  <Badge variant="outline">Open: {m.open}</Badge>
                  <Badge variant="secondary">Done: {m.done}</Badge>
                  <Badge variant={m.overdue > 0 ? 'destructive' : 'secondary'}>
                    Overdue: {m.overdue}
                  </Badge>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}
