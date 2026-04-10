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

type Deleting = { task: Task; projectId: string };

export function DeleteTaskAlert({
  deleting,
  onClose,
  userId,
  onDeleted,
}: {
  deleting: Deleting | null;
  onClose: () => void;
  userId?: string;
  onDeleted: (deletedTaskId: string) => void;
}) {
  const deleteTaskMutation = useDeleteTask({
    listQueryKey:
      deleting && userId
        ? ([
            'projects',
            deleting.projectId,
            'tasks',
            'assignee',
            userId,
          ] as const)
        : undefined,
    onSuccess: (deletedTaskId) => {
      onDeleted(deletedTaskId);
    },
  });

  return (
    <AlertDialog
      open={Boolean(deleting)}
      onOpenChange={(open) => (!open ? onClose() : undefined)}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete task?</AlertDialogTitle>
          <AlertDialogDescription>
            This action can’t be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {deleteTaskMutation.isError && (
          <div className="text-sm text-destructive">
            {(deleteTaskMutation.error as Error)?.message ??
              'Failed to delete task.'}
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={deleteTaskMutation.isPending}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              if (!deleting) return;
              deleteTaskMutation.mutate(deleting.task.id);
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
