'use client';

import * as React from 'react';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BoardColumnProps {
  title: string;
  count: number;
  icon?: React.ReactNode;
  iconBgColor?: string;
  titleColor?: string;
  children?: React.ReactNode;
}

export function BoardColumn({ title, count, icon, iconBgColor = 'bg-muted', titleColor = 'text-foreground', children }: BoardColumnProps) {
  return (
    <div className="flex h-full flex-col gap-4 rounded-xl bg-muted/30 p-2 min-w-0">
      <div className="flex items-center justify-between px-2 pt-2">
        <div className="flex items-center gap-2">
          {icon && (
            <div className={`flex items-center justify-center h-6 w-6 rounded-md ${iconBgColor}`}>
              {icon}
            </div>
          )}
          <h3 className={`font-semibold text-sm ${titleColor}`}>{title}</h3>
          <span className="text-sm font-medium text-muted-foreground ml-1">{count}</span>
        </div>
        <div className="flex items-center">
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground ml-1">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-1 pb-2 scrollbar-thin">
        {children}
      </div>
    </div>
  );
}
