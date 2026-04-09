'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Settings, Share2 } from 'lucide-react';

export function ProjectBoardHeader({ projectName }: { projectName: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Project Board</h1>
        <p className="text-sm text-muted-foreground">{projectName}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Settings
        </Button>
      </div>
    </div>
  );
}
