'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MoreHorizontal, List, AlignJustify, Kanban } from 'lucide-react';

type Project = { id: string; name: string };

export function TasksHeader({
  selectedProjectId,
  onSelectedProjectIdChange,
  projects,
  badgeCount,
}: {
  selectedProjectId: string;
  onSelectedProjectIdChange: (value: string) => void;
  projects: Project[];
  badgeCount: string;
}) {
  return (
    <div className="flex items-center justify-between px-4">
      <div className="flex items-center gap-3">
        <h2 className="text-lg font-semibold tracking-tight">All Task</h2>
        <Select
          value={selectedProjectId}
          onValueChange={onSelectedProjectIdChange}
        >
          <SelectTrigger className="w-50 h-8 rounded-lg">
            <SelectValue placeholder="All projects" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All projects</SelectItem>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center bg-muted/50 p-1 rounded-xl">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 rounded-lg px-3 text-xs"
        >
          <AlignJustify className="h-3.5 w-3.5 mr-2" />
          Spreadsheet
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground h-8 rounded-lg px-3 text-xs"
        >
          <List className="h-3.5 w-3.5 mr-2" />
          Timeline
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="bg-white shadow-sm h-8 rounded-lg px-3 font-semibold text-xs"
        >
          <Kanban className="h-3.5 w-3.5 mr-2" />
          Kanban
          <Badge className="ml-2 bg-muted text-muted-foreground hover:bg-muted font-normal h-4 text-[10px] px-1 rounded-sm border-none">
            {badgeCount}
          </Badge>
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 ml-1 text-muted-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
