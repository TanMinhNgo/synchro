'use client';

import * as React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { projectApi } from '@/features/project';

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);

  const projectQuery = useQuery({
    queryKey: ['projects', projectId],
    queryFn: () => projectApi.getProject(projectId),
    enabled: Boolean(projectId),
  });

  const boardsQuery = useQuery({
    queryKey: ['projects', projectId, 'boards'],
    queryFn: () => projectApi.listBoards(projectId),
    enabled: Boolean(projectId),
  });

  const project = projectQuery.data;
  const boardId = boardsQuery.data?.[0]?.id;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {projectQuery.isLoading ? 'Loading project…' : project?.name ?? 'Project'}
          </h1>
          <p className="text-muted-foreground">Project overview.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects">Back</Link>
          </Button>

          <Button asChild>
            <Link href={`/projects/${projectId}/board`}>Open Board</Link>
          </Button>
        </div>
      </div>

      {(projectQuery.isError || boardsQuery.isError) && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Failed to load project</CardTitle>
            <CardDescription>
              {(projectQuery.error as Error | undefined)?.message ??
                (boardsQuery.error as Error | undefined)?.message ??
                'Unknown error'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {project && (
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Details</CardTitle>
                <CardDescription>{project.description ?? '—'}</CardDescription>
              </div>
              <Badge variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}>
                {project.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Members: {project.memberIds?.length ?? 0}
          </CardContent>
        </Card>
      )}

      {boardsQuery.data && boardsQuery.data.length === 0 && (
        <Card className="border-dashed">
          <CardHeader>
            <CardTitle className="text-base">No boards yet</CardTitle>
            <CardDescription>This project has no boards.</CardDescription>
          </CardHeader>
        </Card>
      )}
    </div>
  );
}
