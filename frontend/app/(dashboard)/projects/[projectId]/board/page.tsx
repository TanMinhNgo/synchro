'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { createPortal } from 'react-dom';
import { BoardColumn } from '@/components/organisms/BoardColumn';
import { TaskCard } from '@/components/molecules/TaskCard';
import { Button } from '@/components/ui/button';
import { Settings, Share2 } from 'lucide-react';
import { projectApi, useProjectBoardData } from '@/features/project';
import { taskApi } from '@/features/task/api/task.api';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';
import type { PublicUser } from '@/shared/types/api/user';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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

function formatDeadline(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function datetimeLocalToIso(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return undefined;
  return d.toISOString();
}

function isoToDatetimeLocal(value?: string) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

function newLocalId() {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

function calcProgress(task: Pick<Task, 'columnKey' | 'subtasks'>) {
  if (task.columnKey === 'done') return 100;
  const subtasks = task.subtasks ?? [];
  if (subtasks.length === 0) return 0;
  const done = subtasks.filter((s) => s.isDone).length;
  return Math.round((done / subtasks.length) * 100);
}

function countSubtasks(task: Pick<Task, 'subtasks'>) {
  const subtasks = task.subtasks ?? [];
  const total = subtasks.length;
  const done = subtasks.filter((s) => s.isDone).length;
  return { done, total };
}

function DroppableArea({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={isOver ? 'rounded-xl ring-1 ring-ring/40' : undefined}
    >
      {children}
    </div>
  );
}

function DraggableTask({
  id,
  data,
  children,
}: {
  id: string;
  data: { taskId: string; columnKey: ProjectColumnKey };
  children: (args: { isDragging: boolean }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    data,
  });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    touchAction: 'none',
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      {children({ isDragging })}
    </div>
  );
}

export default function ProjectBoardPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = React.use(params);
  const { projectQuery, boardsQuery, boardId, columnsQuery, tasksQuery } = useProjectBoardData(projectId);
  const queryClient = useQueryClient();

  const projectName = projectQuery.data?.name ?? `Project ${projectId}`;
  const columns = columnsQuery.data ?? [];
  const tasks = tasksQuery.data;

  const [createColumnKey, setCreateColumnKey] = React.useState<ProjectColumnKey | null>(null);
  const [createTitle, setCreateTitle] = React.useState('');
  const [createDescription, setCreateDescription] = React.useState('');
  const [createPriority, setCreatePriority] = React.useState<Task['priority']>('medium');
  const [createDueAt, setCreateDueAt] = React.useState('');
  const [createAssigneeId, setCreateAssigneeId] = React.useState<string>('');
  const [createSubtasks, setCreateSubtasks] = React.useState<
    Array<{ id: string; title: string; isDone: boolean }>
  >([]);
  const [createNewSubtaskTitle, setCreateNewSubtaskTitle] = React.useState('');

  const [editingTask, setEditingTask] = React.useState<Task | null>(null);
  const [editTitle, setEditTitle] = React.useState('');
  const [editDescription, setEditDescription] = React.useState('');
  const [editPriority, setEditPriority] = React.useState<Task['priority']>('medium');
  const [editDueAt, setEditDueAt] = React.useState('');
  const [editAssigneeId, setEditAssigneeId] = React.useState<string>('');
  const [editSubtasks, setEditSubtasks] = React.useState<
    Array<{ id: string; title: string; isDone: boolean }>
  >([]);
  const [editNewSubtaskTitle, setEditNewSubtaskTitle] = React.useState('');
  const [deletingTask, setDeletingTask] = React.useState<Task | null>(null);

  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

  const createDefaultBoardMutation = useMutation({
    mutationFn: async () => {
      const board = await projectApi.createBoard(projectId, {
        name: 'Main Board',
        description: 'Default board',
      });

      const defaults: Array<{ key: ProjectColumnKey; name: string }> = [
        { key: 'backlog', name: 'Backlog' },
        { key: 'in_progress', name: 'In Progress' },
        { key: 'in_review', name: 'In Review' },
        { key: 'done', name: 'Done' },
      ];

      for (let i = 0; i < defaults.length; i += 1) {
        const col = defaults[i]!;
        await projectApi.createColumn(projectId, board.id, {
          key: col.key,
          name: col.name,
          order: i,
        });
      }

      return board;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects', projectId, 'boards'] });
    },
  });

  const createDefaultColumnsMutation = useMutation({
    mutationFn: async () => {
      if (!boardId) throw new Error('Missing board');

      const defaults: Array<{ key: ProjectColumnKey; name: string }> = [
        { key: 'backlog', name: 'Backlog' },
        { key: 'in_progress', name: 'In Progress' },
        { key: 'in_review', name: 'In Review' },
        { key: 'done', name: 'Done' },
      ];

      for (let i = 0; i < defaults.length; i += 1) {
        const col = defaults[i]!;
        await projectApi.createColumn(projectId, boardId, {
          key: col.key,
          name: col.name,
          order: i,
        });
      }
    },
    onSuccess: async () => {
      if (!boardId) return;
      await queryClient.invalidateQueries({
        queryKey: ['projects', projectId, 'boards', boardId, 'columns'],
      });
    },
  });

  React.useEffect(() => {
    if (!editingTask) return;
    setEditTitle(editingTask.title ?? '');
    setEditDescription(editingTask.description ?? '');
    setEditPriority(editingTask.priority ?? 'medium');
    setEditDueAt(isoToDatetimeLocal(editingTask.dueDate));
    setEditAssigneeId(editingTask.assigneeId ?? '');
    setEditSubtasks((editingTask.subtasks ?? []).map((s) => ({ ...s })));
    setEditNewSubtaskTitle('');
  }, [editingTask]);

  const membersQuery = useQuery({
    queryKey: ['projects', projectId, 'members'],
    queryFn: () => projectApi.listProjectMembers(projectId),
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });

  const members = (membersQuery.data ?? []) as PublicUser[];

  const boardTasksQueryKey = React.useMemo(() => {
    if (!boardId) return null;
    return ['projects', projectId, 'boards', boardId, 'tasks'] as const;
  }, [boardId, projectId]);

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      if (!boardId) throw new Error('Missing board');
      if (!createColumnKey) throw new Error('Missing column');
      const title = createTitle.trim();
      if (!title) throw new Error('Title is required');

      const dueDate = datetimeLocalToIso(createDueAt);
      const subtasks = createSubtasks.map((s) => ({ title: s.title, isDone: s.isDone }));

      return taskApi.createTask(projectId, {
        boardId,
        columnKey: createColumnKey,
        title,
        description: createDescription.trim() || undefined,
        ...(createAssigneeId ? { assigneeId: createAssigneeId } : {}),
        ...(dueDate ? { dueDate } : {}),
        priority: createPriority,
        ...(subtasks.length > 0 ? { subtasks } : {}),
      });
    },
    onSuccess: (created) => {
      if (boardTasksQueryKey) {
        queryClient.setQueryData<Task[]>(boardTasksQueryKey, (prev) => {
          const current = prev ?? [];
          return [created, ...current];
        });
        void queryClient.invalidateQueries({ queryKey: boardTasksQueryKey });
      }
      setCreateColumnKey(null);
      setCreateTitle('');
      setCreateDescription('');
      setCreatePriority('medium');
      setCreateDueAt('');
      setCreateAssigneeId('');
      setCreateSubtasks([]);
      setCreateNewSubtaskTitle('');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async () => {
      if (!editingTask) throw new Error('Missing task');
      const title = editTitle.trim();
      if (!title) throw new Error('Title is required');

      const dueDate = datetimeLocalToIso(editDueAt);
      const subtasks = editSubtasks.map((s) => ({ id: s.id, title: s.title, isDone: s.isDone }));

      const shouldClearAssignee = editAssigneeId === '' && Boolean(editingTask.assigneeId);

      return taskApi.updateTask(editingTask.id, {
        title,
        description: editDescription.trim() || undefined,
        ...(shouldClearAssignee
          ? { assigneeId: null }
          : editAssigneeId
            ? { assigneeId: editAssigneeId }
            : {}),
        ...(dueDate ? { dueDate } : {}),
        priority: editPriority,
        subtasks,
      });
    },
    onSuccess: (updated) => {
      if (boardTasksQueryKey) {
        queryClient.setQueryData<Task[]>(boardTasksQueryKey, (prev) =>
          (prev ?? []).map((t) => (t.id === updated.id ? updated : t)),
        );
        void queryClient.invalidateQueries({ queryKey: boardTasksQueryKey });
      }
      setEditingTask(null);
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async () => {
      if (!deletingTask) throw new Error('Missing task');
      await taskApi.deleteTask(deletingTask.id);
      return deletingTask.id;
    },
    onSuccess: (deletedId) => {
      if (boardTasksQueryKey) {
        queryClient.setQueryData<Task[]>(boardTasksQueryKey, (prev) =>
          (prev ?? []).filter((t) => t.id !== deletedId),
        );
        void queryClient.invalidateQueries({ queryKey: boardTasksQueryKey });
      }
      setDeletingTask(null);
      if (editingTask?.id === deletedId) setEditingTask(null);
    },
  });

  const transitionTaskMutation = useMutation({
    mutationFn: async (vars: { taskId: string; nextColumnKey: ProjectColumnKey }) =>
      taskApi.transitionTask(vars.taskId, { columnKey: vars.nextColumnKey }),
    onMutate: async (vars) => {
      if (!boardTasksQueryKey) return { previous: undefined as Task[] | undefined };
      await queryClient.cancelQueries({ queryKey: boardTasksQueryKey });
      const previous = queryClient.getQueryData<Task[]>(boardTasksQueryKey);
      queryClient.setQueryData<Task[]>(boardTasksQueryKey, (prev) =>
        (prev ?? []).map((t) => (t.id === vars.taskId ? { ...t, columnKey: vars.nextColumnKey } : t)),
      );
      return { previous };
    },
    onError: (_err, _vars, ctx) => {
      if (!boardTasksQueryKey) return;
      if (ctx?.previous) queryClient.setQueryData(boardTasksQueryKey, ctx.previous);
    },
    onSettled: () => {
      if (!boardTasksQueryKey) return;
      void queryClient.invalidateQueries({ queryKey: boardTasksQueryKey });
    },
  });

  const tasksByColumnKey = React.useMemo(() => {
    const map: Partial<Record<ProjectColumnKey, Task[]>> = {};
    for (const task of tasks ?? []) {
      const key = task.columnKey;
      (map[key] ??= []).push(task);
    }
    return map;
  }, [tasks]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const onDragStart = React.useCallback((event: DragStartEvent) => {
    const id = event.active.id;
    if (typeof id !== 'string') return;
    if (!id.startsWith('task:')) return;
    setActiveTaskId(id.replace('task:', ''));
  }, []);

  const onDragEnd = React.useCallback(
    (event: DragEndEvent) => {
      setActiveTaskId(null);
      const overId = event.over?.id;
      if (!overId || typeof overId !== 'string') return;
      if (!overId.startsWith('column:')) return;

      const nextColumnKey = overId.replace('column:', '') as ProjectColumnKey;
      const activeData = event.active.data.current as { taskId: string; columnKey: ProjectColumnKey } | undefined;
      if (!activeData?.taskId) return;
      if (activeData.columnKey === nextColumnKey) return;

      transitionTaskMutation.mutate({ taskId: activeData.taskId, nextColumnKey });
    },
    [transitionTaskMutation],
  );

  const activeTask = React.useMemo(() => {
    if (!activeTaskId) return null;
    return (tasks ?? []).find((t) => t.id === activeTaskId) ?? null;
  }, [activeTaskId, tasks]);

  const isCreateOpen = createColumnKey !== null;
  const canCreate =
    Boolean(boardId && createColumnKey && createTitle.trim().length > 0) &&
    !createTaskMutation.isPending;

  const isEditOpen = editingTask !== null;
  const canUpdate = Boolean(editingTask && editTitle.trim().length > 0) && !updateTaskMutation.isPending;
  
  return (
    <div className="flex h-full flex-col gap-4 overflow-hidden">
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

      {(projectQuery.isLoading || boardsQuery.isLoading) && (
        <div className="text-sm text-muted-foreground">Loading board…</div>
      )}

      {(projectQuery.isError || boardsQuery.isError || columnsQuery.isError || tasksQuery.isError) && (
        <div className="text-sm text-destructive">
          Failed to load board data.
        </div>
      )}

      {!boardsQuery.isLoading && boardsQuery.data && boardsQuery.data.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-sm">
          <div className="text-muted-foreground">This project has no boards yet.</div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => createDefaultBoardMutation.mutate()}
              disabled={createDefaultBoardMutation.isPending}
            >
              {createDefaultBoardMutation.isPending ? 'Creating…' : 'Create board'}
            </Button>
            {createDefaultBoardMutation.isError && (
              <div className="text-sm text-destructive">
                {(createDefaultBoardMutation.error as Error)?.message ?? 'Failed to create board.'}
              </div>
            )}
          </div>
        </div>
      )}

      {!columnsQuery.isLoading && boardId && columnsQuery.data && columnsQuery.data.length === 0 && (
        <div className="rounded-lg border border-dashed p-4 text-sm">
          <div className="text-muted-foreground">This board has no columns yet.</div>
          <div className="mt-3 flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => createDefaultColumnsMutation.mutate()}
              disabled={createDefaultColumnsMutation.isPending}
            >
              {createDefaultColumnsMutation.isPending ? 'Creating…' : 'Create default columns'}
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

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 pb-4">
        <DndContext sensors={sensors} onDragStart={onDragStart} onDragCancel={() => setActiveTaskId(null)} onDragEnd={onDragEnd}>
          {columns
            .slice()
            .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
            .map((col) => {
              const colTasks = tasksByColumnKey[col.key] ?? [];
              return (
                <DroppableArea key={col.id} id={`column:${col.key}`}>
                  <BoardColumn
                    title={col.name}
                    count={colTasks.length}
                    onAdd={() => {
                      setCreateColumnKey(col.key);
                      setCreateTitle('');
                      setCreateDescription('');
                      setCreatePriority('medium');
                      setCreateDueAt('');
                      setCreateAssigneeId('');
                      setCreateSubtasks([]);
                      setCreateNewSubtaskTitle('');
                    }}
                  >
                    {colTasks.map((t) => (
                      <DraggableTask key={t.id} id={`task:${t.id}`} data={{ taskId: t.id, columnKey: t.columnKey }}>
                        {({ isDragging }) => (
                          <TaskCard
                            projectTitle={projectName}
                            deadline={formatDeadline(t.dueDate) || '—'}
                            title={t.title}
                            progress={calcProgress(t)}
                            subtasksDone={countSubtasks(t).done}
                            subtasksTotal={countSubtasks(t).total}
                            isDragging={isDragging}
                            onOpen={() => setEditingTask(t)}
                            onMenu={() => setDeletingTask(t)}
                          />
                        )}
                      </DraggableTask>
                    ))}
                  </BoardColumn>
                </DroppableArea>
              );
            })}

          {typeof document !== 'undefined' &&
            createPortal(
              <DragOverlay>
                {activeTask ? (
                  <TaskCard
                    projectTitle={projectName}
                    deadline={formatDeadline(activeTask.dueDate) || '—'}
                    title={activeTask.title}
                    progress={calcProgress(activeTask)}
                    subtasksDone={countSubtasks(activeTask).done}
                    subtasksTotal={countSubtasks(activeTask).total}
                  />
                ) : null}
              </DragOverlay>,
              document.body,
            )}
        </DndContext>
      </div>

      <Dialog
        open={isCreateOpen}
        onOpenChange={(open) => {
          if (!open) setCreateColumnKey(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Task</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canCreate) return;
              createTaskMutation.mutate();
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={createTitle} onChange={(e) => setCreateTitle(e.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={createDescription} onChange={(e) => setCreateDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={createPriority} onValueChange={(v) => setCreatePriority(v as Task['priority'])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select
                value={createAssigneeId || '__none__'}
                onValueChange={(v) => setCreateAssigneeId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Deadline</label>
              <Input
                type="datetime-local"
                value={createDueAt}
                onChange={(e) => setCreateDueAt(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Subtasks</label>
              <div className="flex flex-col gap-2">
                {createSubtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={s.isDone}
                      onCheckedChange={(checked) => {
                        const isDone = checked === true;
                        setCreateSubtasks((prev) =>
                          prev.map((p) => (p.id === s.id ? { ...p, isDone } : p)),
                        );
                      }}
                    />
                    <Input
                      value={s.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setCreateSubtasks((prev) =>
                          prev.map((p) => (p.id === s.id ? { ...p, title } : p)),
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setCreateSubtasks((prev) => prev.filter((p) => p.id !== s.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={createNewSubtaskTitle}
                  onChange={(e) => setCreateNewSubtaskTitle(e.target.value)}
                  placeholder="New subtask"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const title = createNewSubtaskTitle.trim();
                    if (!title) return;
                    setCreateSubtasks((prev) => [
                      ...prev,
                      { id: newLocalId(), title, isDone: false },
                    ]);
                    setCreateNewSubtaskTitle('');
                  }}
                  disabled={!createNewSubtaskTitle.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {createTaskMutation.isError && (
              <div className="text-sm text-destructive">
                {(createTaskMutation.error as Error)?.message ?? 'Failed to create task.'}
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreateColumnKey(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canCreate}>
                {createTaskMutation.isPending ? 'Creating…' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={(open) => (!open ? setEditingTask(null) : undefined)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          <form
            className="flex flex-col gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!canUpdate) return;
              updateTaskMutation.mutate();
            }}
          >
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Title</label>
              <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} autoFocus />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Description</label>
              <Textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} placeholder="Optional" />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Priority</label>
              <Select value={editPriority} onValueChange={(v) => setEditPriority(v as Task['priority'])}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Assignee</label>
              <Select
                value={editAssigneeId || '__none__'}
                onValueChange={(v) => setEditAssigneeId(v === '__none__' ? '' : v)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Unassigned</SelectItem>
                  {members.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Deadline</label>
              <Input
                type="datetime-local"
                value={editDueAt}
                onChange={(e) => setEditDueAt(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">Subtasks</label>
              <div className="flex flex-col gap-2">
                {editSubtasks.map((s) => (
                  <div key={s.id} className="flex items-center gap-2">
                    <Checkbox
                      checked={s.isDone}
                      onCheckedChange={(checked) => {
                        const isDone = checked === true;
                        setEditSubtasks((prev) =>
                          prev.map((p) => (p.id === s.id ? { ...p, isDone } : p)),
                        );
                      }}
                    />
                    <Input
                      value={s.title}
                      onChange={(e) => {
                        const title = e.target.value;
                        setEditSubtasks((prev) =>
                          prev.map((p) => (p.id === s.id ? { ...p, title } : p)),
                        );
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setEditSubtasks((prev) => prev.filter((p) => p.id !== s.id))}
                    >
                      Remove
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <Input
                  value={editNewSubtaskTitle}
                  onChange={(e) => setEditNewSubtaskTitle(e.target.value)}
                  placeholder="New subtask"
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const title = editNewSubtaskTitle.trim();
                    if (!title) return;
                    setEditSubtasks((prev) => [
                      ...prev,
                      { id: newLocalId(), title, isDone: false },
                    ]);
                    setEditNewSubtaskTitle('');
                  }}
                  disabled={!editNewSubtaskTitle.trim()}
                >
                  Add
                </Button>
              </div>
            </div>

            {updateTaskMutation.isError && (
              <div className="text-sm text-destructive">
                {(updateTaskMutation.error as Error)?.message ?? 'Failed to update task.'}
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  if (!editingTask) return;
                  setDeletingTask(editingTask);
                }}
                disabled={!editingTask || deleteTaskMutation.isPending}
              >
                Delete
              </Button>
              <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!canUpdate}>
                {updateTaskMutation.isPending ? 'Saving…' : 'Save'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={Boolean(deletingTask)} onOpenChange={(open) => (!open ? setDeletingTask(null) : undefined)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action can’t be undone.
            </AlertDialogDescription>
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
                deleteTaskMutation.mutate();
              }}
              disabled={deleteTaskMutation.isPending}
            >
              {deleteTaskMutation.isPending ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
