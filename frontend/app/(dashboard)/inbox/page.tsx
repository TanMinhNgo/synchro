'use client';

import * as React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationRealtime,
  useNotifications,
} from '@/features/notification';
import { useProjects } from '@/features/project/hooks/useProjects';
import type { Notification } from '@/shared/types/api/notification';

type ReadFilter = 'all' | 'unread' | 'read';

function formatTimestamp(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getStringData(n: Notification, key: string): string | undefined {
  const value = n.data?.[key];
  return typeof value === 'string' && value.trim() ? value : undefined;
}

function getNumberData(n: Notification, key: string): number | undefined {
  const value = n.data?.[key];
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  return undefined;
}

export default function InboxPage() {
  const [readFilter, setReadFilter] = React.useState<ReadFilter>('all');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');

  const notificationsQuery = useNotifications();
  useNotificationRealtime();
  const projectsQuery = useProjects();
  const markReadMutation = useMarkNotificationRead();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const notifications = React.useMemo(
    () => notificationsQuery.data ?? [],
    [notificationsQuery.data],
  );

  const projectSegmentById = React.useMemo(() => {
    const m = new Map<string, string>();
    for (const p of projectsQuery.data ?? []) {
      if (p?.id) m.set(p.id, p.slug ?? p.id);
    }
    return m;
  }, [projectsQuery.data]);

  const getNotificationLink = React.useCallback(
    (n: Notification): { href: string; label: string } | null => {
      const projectId = getStringData(n, 'projectId');
      const taskId = getStringData(n, 'taskId');

      const projectSeg = projectId
        ? (projectSegmentById.get(projectId) ?? projectId)
        : undefined;

      if (projectSeg && taskId) {
        return {
          href: `/projects/${projectSeg}/board`,
          label: 'View in board',
        };
      }

      if (projectSeg) {
        return { href: `/projects/${projectSeg}`, label: 'View project' };
      }

      if (taskId) {
        return { href: '/tasks', label: 'View tasks' };
      }

      return null;
    },
    [projectSegmentById],
  );

  const availableTypes = React.useMemo(() => {
    const unique = new Set<string>();
    for (const n of notifications) {
      if (typeof n.type === 'string' && n.type.trim()) unique.add(n.type);
    }
    return Array.from(unique).sort((a, b) => a.localeCompare(b));
  }, [notifications]);

  const filtered = React.useMemo(() => {
    return notifications.filter((n) => {
      if (readFilter === 'read' && !n.read) return false;
      if (readFilter === 'unread' && n.read) return false;
      if (typeFilter !== 'all' && n.type !== typeFilter) return false;
      return true;
    });
  }, [notifications, readFilter, typeFilter]);

  const unreadCount = React.useMemo(
    () => notifications.reduce((acc, n) => acc + (n.read ? 0 : 1), 0),
    [notifications],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Inbox</h1>
        <p className="text-muted-foreground">Your notifications and updates.</p>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Read</span>
            <Select
              value={readFilter}
              onValueChange={(v) => setReadFilter(v as ReadFilter)}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Read" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="unread">Unread</SelectItem>
                <SelectItem value="read">Read</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Type</span>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-50">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {availableTypes.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Badge variant={unreadCount > 0 ? 'default' : 'secondary'}>
            {unreadCount} unread
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={unreadCount === 0 || markAllReadMutation.isPending}
            onClick={() => markAllReadMutation.mutate()}
          >
            {markAllReadMutation.isPending ? 'Marking…' : 'Mark all read'}
          </Button>
        </div>
      </div>

      {notificationsQuery.isError && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">
              Failed to load notifications
            </CardTitle>
            <CardDescription>
              {(notificationsQuery.error as Error | undefined)?.message ??
                'Unknown error'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!notificationsQuery.isLoading && filtered.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No notifications</EmptyTitle>
            <EmptyDescription>You’re all caught up.</EmptyDescription>
          </EmptyHeader>
          <EmptyContent />
        </Empty>
      )}

      {filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((n) => {
            const link = getNotificationLink(n);
            const createdAt = formatTimestamp(n.createdAt);
            return (
              <Card
                key={n.id}
                className={n.read ? undefined : 'border-primary/30'}
              >
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">{n.title}</CardTitle>
                        <Badge variant="outline">{n.type}</Badge>
                        {!n.read && <Badge>Unread</Badge>}
                      </div>
                      <CardDescription className="mt-1">
                        {n.message ?? '—'}
                      </CardDescription>

                      {n.type === 'AI_TASK_REPORT_REVIEW' ? (
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          {getStringData(n, 'verdict') ? (
                            <Badge variant="secondary">
                              Verdict: {getStringData(n, 'verdict')}
                            </Badge>
                          ) : null}
                          {typeof getNumberData(n, 'score') === 'number' ? (
                            <Badge variant="outline">
                              Score: {getNumberData(n, 'score')}/100
                            </Badge>
                          ) : null}
                          {getStringData(n, 'llmSummary') ? (
                            <span className="text-xs text-muted-foreground">
                              {getStringData(n, 'llmSummary')}
                            </span>
                          ) : null}
                        </div>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      {createdAt ? (
                        <span className="text-xs text-muted-foreground">
                          {createdAt}
                        </span>
                      ) : null}
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={markReadMutation.isPending}
                          onClick={() =>
                            markReadMutation.mutate({
                              notificationId: n.id,
                              read: !n.read,
                            })
                          }
                        >
                          {n.read ? 'Mark unread' : 'Mark read'}
                        </Button>
                        {link ? (
                          <Button asChild size="sm">
                            <Link href={link.href}>{link.label}</Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
