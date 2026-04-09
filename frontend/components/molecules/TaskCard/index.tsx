'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { MoreHorizontal, MessageSquare, Link2, Calendar } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

type Priority = 'urgent' | 'high' | 'medium' | 'low';

interface TaskCardProps {
  projectTitle: string;
  deadline?: string;
  title: string;
  priority?: Priority;
  progress?: number;
  subtasksDone?: number;
  subtasksTotal?: number;
  assignees?: Array<{ name: string; avatarUrl?: string }>;
  assigneeKeys?: string[];
  comments?: number;
  links?: number;
  onOpen?: () => void;
  onMenu?: () => void;
  isDragging?: boolean;
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const assigneeColorClasses = [
  'bg-primary/10 text-primary border-primary/20',
  'bg-secondary text-secondary-foreground border-border',
  'bg-accent text-accent-foreground border-border',
  'bg-muted text-foreground border-border',
  'bg-destructive/10 text-destructive border-destructive/20',
] as const;

function getAssigneeColorClass(key: string) {
  if (!key) return assigneeColorClasses[0];
  return assigneeColorClasses[hashString(key) % assigneeColorClasses.length];
}

export function TaskCard({ 
  projectTitle, 
  deadline,
  title, 
  priority,
  progress = 0, 
  subtasksDone,
  subtasksTotal,
  assignees = [], 
  assigneeKeys = [],
  comments = 0, 
  links = 0,
  onOpen,
  onMenu,
  isDragging = false,
}: TaskCardProps) {
  const computedProgress = React.useMemo(() => {
    if (typeof subtasksTotal === 'number' && subtasksTotal > 0) {
      const doneCount = Math.max(0, Math.min(subtasksDone ?? 0, subtasksTotal));
      return Math.round((doneCount / subtasksTotal) * 100);
    }
    return progress;
  }, [progress, subtasksDone, subtasksTotal]);

  const subtaskLabel =
    typeof subtasksTotal === 'number' && subtasksTotal > 0
      ? `${Math.max(0, Math.min(subtasksDone ?? 0, subtasksTotal))}/${subtasksTotal} • ${computedProgress}%`
      : `Progress : ${computedProgress}%`;

  const priorityBadge = React.useMemo(() => {
    if (!priority) return null;
    const labelMap: Record<Priority, string> = {
      urgent: 'Urgent',
      high: 'High',
      medium: 'Medium',
      low: 'Low',
    };
    const variant =
      priority === 'urgent'
        ? 'destructive'
        : priority === 'high'
          ? 'default'
          : priority === 'medium'
            ? 'secondary'
            : 'outline';

    return (
      <Badge variant={variant} className="h-6 rounded-xl px-2">
        {labelMap[priority]}
      </Badge>
    );
  }, [priority]);

  return (
    <Card
      role={onOpen ? 'button' : undefined}
      tabIndex={onOpen ? 0 : undefined}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (!onOpen) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onOpen();
        }
      }}
      className={
        "flex flex-col gap-4 p-5 hover:shadow-sm transition-all border border-border bg-card cursor-grab active:cursor-grabbing rounded-2xl" +
        (isDragging ? ' opacity-0' : '')
      }
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="truncate text-sm font-semibold">{projectTitle}</span>
          {priorityBadge}
        </div>

        <button
          type="button"
          className="shrink-0 text-muted-foreground hover:text-foreground"
          onClick={(e) => {
            e.stopPropagation();
            onMenu?.();
          }}
          aria-label="Task menu"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </div>
      
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl px-2 py-1 text-xs font-medium bg-muted/50 text-muted-foreground">
          <Calendar className="h-3 w-3" />
          <span>{deadline || '—'}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-base leading-snug">{title}</h3>
        
        <div className="flex flex-col gap-1.5 mt-2">
          <Progress value={computedProgress} className="h-2 w-full bg-muted" />
          <span className="text-xs text-muted-foreground">{subtaskLabel}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        {assignees.length > 0 ? (
          <div className="flex -space-x-2">
            {assignees.map((assignee, i) => (
              <Avatar key={i} className="h-8 w-8 border-2 border-background">
                <AvatarImage src={assignee.avatarUrl} />
                <AvatarFallback className={cn('text-[10px] border', getAssigneeColorClass(assignee.name))}>
                  {assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
          </div>
        ) : assigneeKeys.length > 0 ? (
          <div className="flex items-center gap-1">
            {assigneeKeys.slice(0, 4).map((key) => (
              <span
                key={key}
                className={cn('h-3.5 w-3.5 rounded-full border', getAssigneeColorClass(key))}
                aria-label="Assignee"
              />
            ))}
            {assigneeKeys.length > 4 ? (
              <span className="ml-1 text-xs font-medium text-muted-foreground">+{assigneeKeys.length - 4}</span>
            ) : null}
          </div>
        ) : <div />}
        
        <div className="flex items-center gap-3 text-muted-foreground">
          {comments > 0 && (
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span className="text-xs font-medium">{comments}</span>
            </div>
          )}
          {links > 0 && (
            <div className="flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              <span className="text-xs font-medium">{links}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
