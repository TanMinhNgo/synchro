'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
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
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
} from '@/features/goal';
import type { Goal } from '@/shared/types/api/goal';

function isoToDateInput(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  return `${yyyy}-${mm}-${dd}`;
}

function dateInputToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function clampProgress(value: number) {
  if (Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export default function GoalsPage() {
  const goalsQuery = useGoals();
  const createGoalMutation = useCreateGoal();
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();

  const goals = React.useMemo(() => goalsQuery.data ?? [], [goalsQuery.data]);

  const [createOpen, setCreateOpen] = React.useState(false);
  const [editGoal, setEditGoal] = React.useState<Goal | null>(null);
  const [deleteGoal, setDeleteGoal] = React.useState<Goal | null>(null);

  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [targetDate, setTargetDate] = React.useState('');
  const [progress, setProgress] = React.useState('0');

  React.useEffect(() => {
    if (!createOpen) return;
    setTitle('');
    setDescription('');
    setTargetDate('');
    setProgress('0');
  }, [createOpen]);

  React.useEffect(() => {
    if (!editGoal) return;
    setTitle(editGoal.title ?? '');
    setDescription(editGoal.description ?? '');
    setTargetDate(isoToDateInput(editGoal.targetDate));
    setProgress(String(editGoal.progress ?? 0));
  }, [editGoal]);

  const isBusy =
    goalsQuery.isLoading ||
    createGoalMutation.isPending ||
    updateGoalMutation.isPending ||
    deleteGoalMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Goals</h1>
          <p className="text-muted-foreground">
            Track objectives and progress.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} disabled={isBusy}>
          New goal
        </Button>
      </div>

      {goalsQuery.isError && (
        <Card className="border-destructive/30">
          <CardHeader>
            <CardTitle className="text-base">Failed to load goals</CardTitle>
            <CardDescription>
              {(goalsQuery.error as Error | undefined)?.message ??
                'Unknown error'}
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      {!goalsQuery.isLoading && goals.length === 0 && (
        <Empty>
          <EmptyHeader>
            <EmptyTitle>No goals yet</EmptyTitle>
            <EmptyDescription>
              Create your first goal to start tracking progress.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      )}

      {goals.length > 0 && (
        <div className="space-y-2">
          {goals
            .slice()
            .sort((a, b) =>
              (b.createdAt ?? '').localeCompare(a.createdAt ?? ''),
            )
            .map((g) => (
              <Card key={g.id}>
                <CardHeader className="space-y-2">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <CardTitle className="text-base">{g.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {g.description ?? '—'}
                      </CardDescription>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">
                          {clampProgress(g.progress)}%
                        </Badge>
                        {g.targetDate ? (
                          <Badge variant="secondary">
                            Target: {isoToDateInput(g.targetDate)}
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditGoal(g)}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setDeleteGoal(g)}
                      >
                        Delete
                      </Button>
                    </div>
                  </div>
                  <Progress value={clampProgress(g.progress)} />
                </CardHeader>
              </Card>
            ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New goal</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="goalTitle">
                Title
              </label>
              <Input
                id="goalTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ship MVP…"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="goalDescription">
                Description
              </label>
              <Textarea
                id="goalDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Optional"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="goalTargetDate">
                  Target date
                </label>
                <Input
                  id="goalTargetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium" htmlFor="goalProgress">
                  Progress (%)
                </label>
                <Input
                  id="goalProgress"
                  inputMode="numeric"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                />
              </div>
            </div>

            {createGoalMutation.isError && (
              <div className="text-sm text-destructive">
                {(createGoalMutation.error as Error | undefined)?.message ??
                  'Failed to create goal'}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              disabled={createGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={createGoalMutation.isPending || !title.trim()}
              onClick={() =>
                createGoalMutation.mutate(
                  {
                    title: title.trim(),
                    description: description.trim() || undefined,
                    targetDate: dateInputToIso(targetDate),
                    progress: clampProgress(Number(progress)),
                  },
                  {
                    onSuccess: () => setCreateOpen(false),
                  },
                )
              }
            >
              {createGoalMutation.isPending ? 'Creating…' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editGoal)}
        onOpenChange={(open) => !open && setEditGoal(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit goal</DialogTitle>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <label className="text-sm font-medium" htmlFor="editGoalTitle">
                Title
              </label>
              <Input
                id="editGoalTitle"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label
                className="text-sm font-medium"
                htmlFor="editGoalDescription"
              >
                Description
              </label>
              <Textarea
                id="editGoalDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  htmlFor="editGoalTargetDate"
                >
                  Target date
                </label>
                <Input
                  id="editGoalTargetDate"
                  type="date"
                  value={targetDate}
                  onChange={(e) => setTargetDate(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <label
                  className="text-sm font-medium"
                  htmlFor="editGoalProgress"
                >
                  Progress (%)
                </label>
                <Input
                  id="editGoalProgress"
                  inputMode="numeric"
                  value={progress}
                  onChange={(e) => setProgress(e.target.value)}
                />
              </div>
            </div>

            {updateGoalMutation.isError && (
              <div className="text-sm text-destructive">
                {(updateGoalMutation.error as Error | undefined)?.message ??
                  'Failed to update goal'}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditGoal(null)}
              disabled={updateGoalMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              disabled={
                updateGoalMutation.isPending || !editGoal || !title.trim()
              }
              onClick={() => {
                if (!editGoal) return;
                updateGoalMutation.mutate(
                  {
                    goalId: editGoal.id,
                    input: {
                      title: title.trim(),
                      description: description.trim() || undefined,
                      targetDate: dateInputToIso(targetDate),
                      progress: clampProgress(Number(progress)),
                    },
                  },
                  { onSuccess: () => setEditGoal(null) },
                );
              }}
            >
              {updateGoalMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={Boolean(deleteGoal)}
        onOpenChange={(open) => !open && setDeleteGoal(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete goal</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteGoalMutation.isPending}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!deleteGoal) return;
                deleteGoalMutation.mutate(
                  { goalId: deleteGoal.id },
                  { onSuccess: () => setDeleteGoal(null) },
                );
              }}
              disabled={deleteGoalMutation.isPending}
            >
              {deleteGoalMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
