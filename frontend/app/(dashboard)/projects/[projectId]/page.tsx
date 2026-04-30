'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProject } from '@/features/project/hooks/use-project';
import { useProjectBoards } from '@/features/project/hooks/use-project-boards';
import { useProjectMembers } from '@/features/project/hooks/use-project-members';
import { useUpdateProject } from '@/features/project/hooks/use-update-project';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export default function ProjectOverviewPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);

  const projectQuery = useProject(projectId);
  const boardsQuery = useProjectBoards(projectId);

  const project = projectQuery.data;
  const [isEditOpen, setIsEditOpen] = React.useState(false);
  const [editName, setEditName] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editStatus, setEditStatus] = React.useState<'ACTIVE' | 'ARCHIVED'>(
    'ACTIVE',
  );
  const [editMemberIds, setEditMemberIds] = React.useState<string[]>([]);

  const projectMembersQuery = useProjectMembers(projectId, {
    enabled: Boolean(projectId) && isEditOpen,
  });
  const projectMembers = projectMembersQuery.data ?? [];

  React.useEffect(() => {
    if (!isEditOpen || !project) return;
    setEditName(project.name ?? '');
    setEditDescription(project.description ?? '');
    setEditStatus(project.status ?? 'ACTIVE');
    setEditMemberIds(project.memberIds ?? []);
  }, [isEditOpen, project]);

  const updateProjectMutation = useUpdateProject({
    onSuccess: () => {
      setIsEditOpen(false);
    },
  });

  const canUpdate =
    editName.trim().length > 0 && !updateProjectMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {projectQuery.isLoading
              ? 'Loading project…'
              : (project?.name ?? 'Project')}
          </h1>
          <p className="text-muted-foreground">Project overview.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href="/projects">Back</Link>
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            disabled={!project}
          >
            Edit Project
          </Button>

          <Button asChild>
            <Link href={`/projects/${projectId}/board`}>Open Board</Link>
          </Button>
        </div>
      </div>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!project || !canUpdate) return;
              updateProjectMutation.mutate({
                projectId: project.id,
                name: editName,
                description: editDescription,
                status: editStatus,
                memberIds: editMemberIds,
              });
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Name</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Status</label>
              <Select
                value={editStatus}
                onValueChange={(value) =>
                  setEditStatus(value as 'ACTIVE' | 'ARCHIVED')
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIVE">ACTIVE</SelectItem>
                  <SelectItem value="ARCHIVED">ARCHIVED</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Members</label>
              {projectMembers.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No members available for this project.
                </p>
              ) : (
                <div className="flex flex-col gap-2">
                  {projectMembers.map((member) => {
                    const checked = editMemberIds.includes(member.id);
                    return (
                      <label
                        key={member.id}
                        className="flex items-center gap-2 text-sm"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const isChecked = next === true;
                            setEditMemberIds((prev) => {
                              if (isChecked)
                                return Array.from(
                                  new Set([...prev, member.id]),
                                );
                              return prev.filter((id) => id !== member.id);
                            });
                          }}
                        />
                        <span className="font-medium">{member.name}</span>
                        <span className="text-muted-foreground">
                          {member.email}
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {updateProjectMutation.isError && (
              <div className="text-sm text-destructive">
                {(updateProjectMutation.error as Error)?.message ??
                  'Failed to update project.'}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={!canUpdate}>
                {updateProjectMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
              <Badge
                variant={project.status === 'ACTIVE' ? 'default' : 'secondary'}
              >
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
