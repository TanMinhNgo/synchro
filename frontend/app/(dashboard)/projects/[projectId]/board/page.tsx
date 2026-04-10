'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { useProjectBoardData } from '@/features/project';
import { useCreateDefaultBoard } from '@/features/project/hooks/use-create-default-board';
import { useCreateDefaultColumns } from '@/features/project/hooks/use-create-default-columns';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';
import { ProjectBoardHeader } from './_components/ProjectBoardHeader';
import { ProjectBoardKanban } from './_components/ProjectBoardKanban';
import { CreateBoardTaskDialog } from './_components/CreateBoardTaskDialog';
import { EditBoardTaskDialog } from './_components/EditBoardTaskDialog';
import { DeleteBoardTaskAlert } from './_components/DeleteBoardTaskAlert';

export default function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  const { projectQuery, boardsQuery, boardId, columnsQuery, tasksQuery } =
    useProjectBoardData(projectId);

  const projectName = projectQuery.data?.name ?? `Project ${projectId}`;
  const columns = columnsQuery.data ?? [];
  const tasks = tasksQuery.data;

  const [createColumnKey, setCreateColumnKey] =
    React.useState<ProjectColumnKey | null>(null);
  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = React.useState<Task | null>(null);

  const createDefaultBoardMutation = useCreateDefaultBoard(projectId);
  const createDefaultColumnsMutation = useCreateDefaultColumns(
    projectId,
    boardId,
  );
  const isCreateOpen = createColumnKey !== null;

  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
      <ProjectBoardHeader projectName={projectName} />

      {(projectQuery.isLoading || boardsQuery.isLoading) && (
        <div className="text-sm text-muted-foreground">Loading board…</div>
      )}

      {(projectQuery.isError ||
        boardsQuery.isError ||
        columnsQuery.isError ||
        tasksQuery.isError) && (
        <div className="text-sm text-destructive">
          Failed to load board data.
        </div>
      )}

      {!boardsQuery.isLoading &&
        boardsQuery.data &&
        boardsQuery.data.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm">
            <div className="text-muted-foreground">
              This project has no boards yet.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => createDefaultBoardMutation.mutate()}
                disabled={createDefaultBoardMutation.isPending}
              >
                {createDefaultBoardMutation.isPending
                  ? 'Creating…'
                  : 'Create board'}
              </Button>
              {createDefaultBoardMutation.isError && (
                <div className="text-sm text-destructive">
                  {(createDefaultBoardMutation.error as Error)?.message ??
                    'Failed to create board.'}
                </div>
              )}
            </div>
          </div>
        )}

      {!columnsQuery.isLoading &&
        boardId &&
        columnsQuery.data &&
        columnsQuery.data.length === 0 && (
          <div className="rounded-lg border border-dashed p-4 text-sm">
            <div className="text-muted-foreground">
              This board has no columns yet.
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => createDefaultColumnsMutation.mutate()}
                disabled={createDefaultColumnsMutation.isPending}
              >
                {createDefaultColumnsMutation.isPending
                  ? 'Creating…'
                  : 'Create default columns'}
              </Button>
              {createDefaultColumnsMutation.isError && (
                <div className="text-sm text-destructive">
                  {(createDefaultColumnsMutation.error as Error)?.message ??
                    'Failed to create columns.'}
                </div>
              )}
            </div>
          </div>
        )}

      <ProjectBoardKanban
        projectName={projectName}
        projectId={projectId}
        boardId={boardId}
        columns={columns}
        tasks={tasks}
        onAdd={(columnKey) => setCreateColumnKey(columnKey)}
        onOpen={(task) => setEditingTask(task)}
        onDelete={(task) => setDeletingTask(task)}
      />

      <CreateBoardTaskDialog
        open={isCreateOpen}
        columnKey={createColumnKey}
        projectId={projectId}
        boardId={boardId}
        onClose={() => setCreateColumnKey(null)}
      />

      <EditBoardTaskDialog
        editingTask={editingTask}
        projectId={projectId}
        boardId={boardId}
        onClose={() => setEditingTask(null)}
        onRequestDelete={(task) => setDeletingTask(task)}
      />

      <DeleteBoardTaskAlert
        deletingTask={deletingTask}
        projectId={projectId}
        boardId={boardId}
        onClose={() => setDeletingTask(null)}
        onDeleted={(deletedTaskId) => {
          setDeletingTask(null);
          setEditingTask((prev) => (prev?.id === deletedTaskId ? null : prev));
        }}
      />
    </div>
  );
}
