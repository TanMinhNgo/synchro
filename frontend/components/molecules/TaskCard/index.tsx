'use client';

import * as React from 'react';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MoreHorizontal, MessageSquare, Link2, BarChart2 } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface TaskCardProps {
  projectTitle: string;
  deadline?: string;
  title: string;
  progress?: number;
  subtasksDone?: number;
  subtasksTotal?: number;
  assignees?: Array<{ name: string; avatarUrl?: string }>;
  comments?: number;
  links?: number;
  onOpen?: () => void;
  onMenu?: () => void;
  isDragging?: boolean;
}

export function TaskCard({ 
  projectTitle, 
  deadline,
  title, 
  progress = 0, 
  subtasksDone,
  subtasksTotal,
  assignees = [], 
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
        "flex flex-col gap-4 p-4 hover:border-black/20 hover:shadow-sm transition-all border border-black/5 bg-white cursor-grab active:cursor-grabbing rounded-2xl" +
        (isDragging ? ' opacity-0' : '')
      }
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold">{projectTitle}</span>
        <button
          type="button"
          className="text-muted-foreground hover:text-foreground"
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
        <div className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium bg-muted/50 text-muted-foreground">
          <BarChart2 className="h-3 w-3 text-red-500" />
          <span>{deadline || '—'}</span>
        </div>
      </div>
      
      <div className="flex flex-col gap-3">
        <h3 className="font-semibold text-sm leading-snug">{title}</h3>
        
        <div className="flex flex-col gap-1.5 mt-2">
          <Progress value={computedProgress} className="h-1.5 w-full bg-muted" />
          <span className="text-xs text-muted-foreground">{subtaskLabel}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between mt-1">
        {assignees.length > 0 ? (
          <div className="flex -space-x-2">
            {assignees.map((assignee, i) => (
              <Avatar key={i} className="h-7 w-7 border-2 border-white">
                <AvatarImage src={assignee.avatarUrl} />
                <AvatarFallback className="text-[10px] bg-primary/10 text-primary">
                  {assignee.name.charAt(0)}
                </AvatarFallback>
              </Avatar>
            ))}
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
