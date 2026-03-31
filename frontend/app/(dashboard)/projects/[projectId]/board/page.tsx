'use client';

import * as React from 'react';
import { BoardColumn } from '@/components/organisms/BoardColumn';
import { TaskCard } from '@/components/molecules/TaskCard';
import { Button } from '@/components/ui/button';
import { Settings, Share2 } from 'lucide-react';

export default function ProjectBoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = React.use(params);
  
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Project Board</h1>
          <p className="text-sm text-muted-foreground">Manage tasks for project {projectId}</p>
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 pb-4">
        <BoardColumn title="To Do" count={2}>
          <TaskCard 
            projectTitle="UI Design"
            date="Oct 20"
            title="Design system implementation" 
            progress={30}
            comments={3}
            assignees={[{ name: 'John Doe' }]}
          />
          <TaskCard 
            projectTitle="Infrastructure"
            date="Oct 22"
            title="Setup database schema" 
            progress={0}
            links={1}
          />
        </BoardColumn>
        
        <BoardColumn title="In Progress" count={1}>
          <TaskCard 
            projectTitle="Backend"
            date="Oct 24"
            title="Authentication flow with Next.js" 
            progress={50}
            comments={5}
            assignees={[{ name: 'Sarah Smith' }]}
          />
        </BoardColumn>

        <BoardColumn title="Review" count={0}>
          {/* Empty state can safely be rendered */}
        </BoardColumn>

        <BoardColumn title="Done" count={1}>
          <TaskCard 
            projectTitle="Setup"
            date="Oct 10"
            title="Initial project setup" 
            progress={100}
            assignees={[{ name: 'John Doe' }, { name: 'Sarah Smith' }]}
          />
        </BoardColumn>
      </div>
    </div>
  );
}
