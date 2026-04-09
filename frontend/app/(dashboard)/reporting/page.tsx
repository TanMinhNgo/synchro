"use client";

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useMyTasksKanban } from '@/features/task/hooks/useMyTasksKanban';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { TaskPriority } from '@/shared/types/api/task';

export default function ReportingPage() {
  const { isLoading, isError, items, currentUserQuery, projectsQuery, taskQueries } =
    useMyTasksKanban();

  const tasks = React.useMemo(() => items.map((i) => i.task), [items]);

  const now = React.useMemo(() => new Date(), []);
  const upcomingCutoff = React.useMemo(() => {
    const d = new Date(now);
    d.setDate(d.getDate() + 7);
    return d;
  }, [now]);

  const countsByStatus = React.useMemo(() => {
    const base: Record<ProjectColumnKey, number> = {
      backlog: 0,
      in_progress: 0,
      in_review: 0,
      done: 0,
    };
    for (const t of tasks) base[t.columnKey] = (base[t.columnKey] ?? 0) + 1;
    return base;
  }, [tasks]);

  const countsByPriority = React.useMemo(() => {
    const base: Record<TaskPriority, number> = {
      urgent: 0,
      high: 0,
      medium: 0,
      low: 0,
    };
    for (const t of tasks) base[t.priority] = (base[t.priority] ?? 0) + 1;
    return base;
  }, [tasks]);

  const dueBuckets = React.useMemo(() => {
    let overdue = 0;
    let upcoming = 0;
    let noDue = 0;

    for (const t of tasks) {
      if (t.columnKey === 'done') continue;
      if (!t.dueDate) {
        noDue++;
        continue;
      }
      const due = new Date(t.dueDate);
      if (Number.isNaN(due.getTime())) {
        noDue++;
        continue;
      }
      if (due < now) overdue++;
      else if (due <= upcomingCutoff) upcoming++;
    }

    return { overdue, upcoming, noDue };
  }, [now, tasks, upcomingCutoff]);

  const totalsByProject = React.useMemo(() => {
    const map = new Map<string, { projectId: string; projectName: string; total: number; overdue: number }>();

    for (const item of items) {
      const entry = map.get(item.projectId) ?? {
        projectId: item.projectId,
        projectName: item.projectName,
        total: 0,
        overdue: 0,
      };
      entry.total++;
      if (item.task.columnKey !== 'done' && item.task.dueDate) {
        const due = new Date(item.task.dueDate);
        if (!Number.isNaN(due.getTime()) && due < now) entry.overdue++;
      }
      map.set(item.projectId, entry);
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [items, now]);

  const totalTasks = tasks.length;
  const totalOpen = totalTasks - countsByStatus.done;

  const errorMessage =
    (currentUserQuery.error as Error | undefined)?.message ??
    (projectsQuery.error as Error | undefined)?.message ??
    (taskQueries.find((q) => q.isError)?.error as Error | undefined)?.message;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reporting</h1>
        <p className="text-muted-foreground">Insights for your work and projects.</p>
      </div>

      {isError && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Failed to load reporting</CardTitle>
            <CardDescription>{errorMessage ?? 'Unknown error'}</CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Overview</CardTitle>
            <CardDescription>Your assigned tasks across projects.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Total: {isLoading ? '—' : totalTasks}</Badge>
            <Badge variant="outline">Open: {isLoading ? '—' : totalOpen}</Badge>
            <Badge variant={dueBuckets.overdue > 0 ? 'destructive' : 'secondary'}>
              Overdue: {isLoading ? '—' : dueBuckets.overdue}
            </Badge>
            <Badge variant="secondary">Upcoming (7d): {isLoading ? '—' : dueBuckets.upcoming}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Due dates</CardTitle>
            <CardDescription>Only open tasks are counted.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant={dueBuckets.overdue > 0 ? 'destructive' : 'secondary'}>
              Overdue: {isLoading ? '—' : dueBuckets.overdue}
            </Badge>
            <Badge variant="secondary">Upcoming (7d): {isLoading ? '—' : dueBuckets.upcoming}</Badge>
            <Badge variant="outline">No due date: {isLoading ? '—' : dueBuckets.noDue}</Badge>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">By status</CardTitle>
            <CardDescription>Kanban columns distribution.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="outline">Backlog: {isLoading ? '—' : countsByStatus.backlog}</Badge>
            <Badge variant="outline">In progress: {isLoading ? '—' : countsByStatus.in_progress}</Badge>
            <Badge variant="outline">In review: {isLoading ? '—' : countsByStatus.in_review}</Badge>
            <Badge variant="secondary">Done: {isLoading ? '—' : countsByStatus.done}</Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">By priority</CardTitle>
            <CardDescription>How your tasks are prioritized.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant={countsByPriority.urgent > 0 ? 'destructive' : 'outline'}>
              Urgent: {isLoading ? '—' : countsByPriority.urgent}
            </Badge>
            <Badge variant="outline">High: {isLoading ? '—' : countsByPriority.high}</Badge>
            <Badge variant="outline">Medium: {isLoading ? '—' : countsByPriority.medium}</Badge>
            <Badge variant="outline">Low: {isLoading ? '—' : countsByPriority.low}</Badge>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">By project</CardTitle>
          <CardDescription>Task counts and overdue items.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Project</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Overdue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    Loading…
                  </TableCell>
                </TableRow>
              )}
              {!isLoading && totalsByProject.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-muted-foreground">
                    No projects found.
                  </TableCell>
                </TableRow>
              )}
              {totalsByProject.map((p) => (
                <TableRow key={p.projectId}>
                  <TableCell className="font-medium">{p.projectName}</TableCell>
                  <TableCell>{p.total}</TableCell>
                  <TableCell>
                    <Badge variant={p.overdue > 0 ? 'destructive' : 'secondary'}>{p.overdue}</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
