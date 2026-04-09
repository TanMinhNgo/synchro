'use client';

import * as React from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useDeleteTask } from '@/features/task/hooks/use-delete-task';
import type { Task } from '@/shared/types/api/task';

export function DeleteBoardTaskAlert({
  deletingTask,
  projectId,
  boardId,
  onClose,
  onDeleted,
}: {
  deletingTask: Task | null;
  projectId: string;
  boardId?: string;
  onClose: () => void;
  onDeleted: (deletedTaskId: string) => void;
}) {
  const boardTasksQueryKey = React.useMemo(() => {
    if (!boardId) return null;
    return ['projects', projectId, 'boards', boardId, 'tasks'] as const;
  }, [boardId, projectId]);

  const deleteTaskMutation = useDeleteTask({
    listQueryKey: boardTasksQueryKey ?? undefined,
    onSuccess: (deletedId) => {
      onDeleted(deletedId);
    },
  });

  return (
    <AlertDialog open={Boolean(deletingTask)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>This action can’t be undone.</AlertDialogDescription>
        </AlertDialogHeader>
        {deleteTaskMutation.isError && (
          <div className="text-sm text-destructive">
            {(deleteTaskMutation.error as Error)?.message ?? 'Failed to delete task.'}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTaskMutation.isPending}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (!deletingTask) return;
              deleteTaskMutation.mutate(deletingTask.id);
            }}
            disabled={deleteTaskMutation.isPending}
          >
            {deleteTaskMutation.isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
