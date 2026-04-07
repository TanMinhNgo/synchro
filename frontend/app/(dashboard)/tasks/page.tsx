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
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, List, AlignJustify, Kanban, CheckCircle2, Clock, PlayCircle, Eye } from 'lucide-react';
import { useMyTasksKanban } from '@/features/task/hooks/useMyTasksKanban';
import { projectApi } from '@/features/project/api/project.api';
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
    data: { taskId: string; columnKey: ProjectColumnKey; projectId: string };
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

function formatDeadline(value?: string) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
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

function startOfLocalDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function addDays(d: Date, days: number) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}

function sameLocalDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

export default function MyTasksPage() {
    const { isLoading, isError, items, currentUserQuery, projectsQuery } = useMyTasksKanban();
    const queryClient = useQueryClient();

    const userId = currentUserQuery.data?.id;
    const projects = React.useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

    const [selectedProjectId, setSelectedProjectId] = React.useState<string>('all');

    const [createColumnKey, setCreateColumnKey] = React.useState<ProjectColumnKey | null>(null);
    const [createProjectId, setCreateProjectId] = React.useState<string>('');
    const [createAssigneeId, setCreateAssigneeId] = React.useState<string>('');
    const [createTitle, setCreateTitle] = React.useState('');
    const [createDescription, setCreateDescription] = React.useState('');
    const [createPriority, setCreatePriority] = React.useState<Task['priority']>('medium');
    const [createDueAt, setCreateDueAt] = React.useState('');
    const [createSubtasks, setCreateSubtasks] = React.useState<
        Array<{ id: string; title: string; isDone: boolean }>
    >([]);
    const [createNewSubtaskTitle, setCreateNewSubtaskTitle] = React.useState('');

    const [editing, setEditing] = React.useState<{ task: Task; projectId: string; projectName: string } | null>(null);
    const [editTitle, setEditTitle] = React.useState('');
    const [editDescription, setEditDescription] = React.useState('');
    const [editPriority, setEditPriority] = React.useState<Task['priority']>('medium');
    const [editDueAt, setEditDueAt] = React.useState('');
    const [editAssigneeId, setEditAssigneeId] = React.useState<string>('');
    const [editSubtasks, setEditSubtasks] = React.useState<
        Array<{ id: string; title: string; isDone: boolean }>
    >([]);
    const [editNewSubtaskTitle, setEditNewSubtaskTitle] = React.useState('');
    const [deleting, setDeleting] = React.useState<{ task: Task; projectId: string } | null>(null);

    const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

    React.useEffect(() => {
        if (!editing) return;
        setEditTitle(editing.task.title ?? '');
        setEditDescription(editing.task.description ?? '');
        setEditPriority(editing.task.priority ?? 'medium');
        setEditDueAt(isoToDatetimeLocal(editing.task.dueDate));
        setEditAssigneeId(editing.task.assigneeId ?? '');
        setEditSubtasks((editing.task.subtasks ?? []).map((s) => ({ ...s })));
        setEditNewSubtaskTitle('');
    }, [editing]);

    const isCreateOpen = createColumnKey !== null;

    React.useEffect(() => {
        if (!isCreateOpen) return;
        if (selectedProjectId !== 'all') {
            setCreateProjectId(selectedProjectId);
            return;
        }
        if (!createProjectId && projects.length > 0) setCreateProjectId(projects[0]!.id);
    }, [createProjectId, isCreateOpen, projects, selectedProjectId]);

    React.useEffect(() => {
        if (!isCreateOpen) return;
        if (!createAssigneeId && userId) setCreateAssigneeId(userId);
    }, [createAssigneeId, isCreateOpen, userId]);

    const boardsQuery = useQuery({
        queryKey: ['projects', createProjectId, 'boards'],
        queryFn: () => projectApi.listBoards(createProjectId),
        enabled: Boolean(isCreateOpen && createProjectId),
        staleTime: 10_000,
    });

    const createMembersQuery = useQuery({
        queryKey: ['projects', createProjectId, 'members'],
        queryFn: () => projectApi.listProjectMembers(createProjectId),
        enabled: Boolean(isCreateOpen && createProjectId),
        staleTime: 10_000,
    });

    const editMembersQuery = useQuery({
        queryKey: ['projects', editing?.projectId, 'members'],
        queryFn: () => projectApi.listProjectMembers(editing!.projectId),
        enabled: Boolean(editing?.projectId),
        staleTime: 10_000,
    });

    const createBoardId = boardsQuery.data && boardsQuery.data.length > 0 ? boardsQuery.data[0]!.id : undefined;

    const createDefaultBoardMutation = useMutation({
        mutationFn: async () => {
            if (!createProjectId) throw new Error('Missing project');
            const board = await projectApi.createBoard(createProjectId, {
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
                await projectApi.createColumn(createProjectId, board.id, {
                    key: col.key,
                    name: col.name,
                    order: i,
                });
            }

            return board;
        },
        onSuccess: async () => {
            if (!createProjectId) return;
            await queryClient.invalidateQueries({ queryKey: ['projects', createProjectId, 'boards'] });
        },
    });

    const createTaskMutation = useMutation({
        mutationFn: async () => {
            if (!createColumnKey) throw new Error('Missing column');
            if (!createProjectId) throw new Error('Missing project');
            if (!createBoardId) throw new Error('This project has no board');
            const title = createTitle.trim();
            if (!title) throw new Error('Title is required');

            const dueDate = datetimeLocalToIso(createDueAt);
            const subtasks = createSubtasks.map((s) => ({ title: s.title, isDone: s.isDone }));

            return taskApi.createTask(createProjectId, {
                boardId: createBoardId,
                columnKey: createColumnKey,
                title,
                description: createDescription.trim() || undefined,
                priority: createPriority,
                ...(createAssigneeId ? { assigneeId: createAssigneeId } : {}),
                ...(dueDate ? { dueDate } : {}),
                ...(subtasks.length > 0 ? { subtasks } : {}),
            });
        },
        onSuccess: (created) => {
            if (userId && createAssigneeId === userId) {
                const key = ['projects', createProjectId, 'tasks', 'assignee', userId] as const;
                queryClient.setQueryData<Task[]>(key, (prev) => [created, ...(prev ?? [])]);
                void queryClient.invalidateQueries({ queryKey: key });
            }
            setCreateColumnKey(null);
            setCreateTitle('');
            setCreateDescription('');
            setCreatePriority('medium');
            setCreateDueAt('');
            setCreateAssigneeId(userId ?? '');
            setCreateSubtasks([]);
            setCreateNewSubtaskTitle('');
        },
    });

    const updateTaskMutation = useMutation({
        mutationFn: async () => {
            if (!editing) throw new Error('Missing task');
            const title = editTitle.trim();
            if (!title) throw new Error('Title is required');

            const dueDate = datetimeLocalToIso(editDueAt);
            const subtasks = editSubtasks.map((s) => ({ id: s.id, title: s.title, isDone: s.isDone }));

            const shouldClearAssignee = editAssigneeId === '' && Boolean(editing.task.assigneeId);

            return taskApi.updateTask(editing.task.id, {
                title,
                description: editDescription.trim() || undefined,
                priority: editPriority,
                ...(shouldClearAssignee
                    ? { assigneeId: null }
                    : editAssigneeId
                      ? { assigneeId: editAssigneeId }
                      : {}),
                ...(dueDate ? { dueDate } : {}),
                subtasks,
            });
        },
        onSuccess: (updated) => {
            if (editing && userId) {
                const key = ['projects', editing.projectId, 'tasks', 'assignee', userId] as const;
                queryClient.setQueryData<Task[]>(key, (prev) => {
                    const list = prev ?? [];
                    const isMine = updated.assigneeId === userId;
                    if (!isMine) return list.filter((t) => t.id !== updated.id);
                    const exists = list.some((t) => t.id === updated.id);
                    return exists
                        ? list.map((t) => (t.id === updated.id ? updated : t))
                        : [updated, ...list];
                });
                void queryClient.invalidateQueries({ queryKey: key });
            }
            setEditing(null);
        },
    });

    const deleteTaskMutation = useMutation({
        mutationFn: async () => {
            if (!deleting) throw new Error('Missing task');
            await taskApi.deleteTask(deleting.task.id);
            return deleting;
        },
        onSuccess: (ctx) => {
            if (!userId) return;
            const key = ['projects', ctx.projectId, 'tasks', 'assignee', userId] as const;
            queryClient.setQueryData<Task[]>(key, (prev) => (prev ?? []).filter((t) => t.id !== ctx.task.id));
            void queryClient.invalidateQueries({ queryKey: key });
            setDeleting(null);
            if (editing?.task.id === ctx.task.id) setEditing(null);
        },
    });

    const transitionTaskMutation = useMutation({
        mutationFn: async (vars: { taskId: string; projectId: string; nextColumnKey: ProjectColumnKey }) =>
            taskApi.transitionTask(vars.taskId, { columnKey: vars.nextColumnKey }),
        onMutate: async (vars) => {
            if (!userId) return { previous: undefined as Task[] | undefined };
            const key = ['projects', vars.projectId, 'tasks', 'assignee', userId] as const;
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<Task[]>(key);
            queryClient.setQueryData<Task[]>(key, (prev) =>
                (prev ?? []).map((t) => (t.id === vars.taskId ? { ...t, columnKey: vars.nextColumnKey } : t)),
            );
            return { previous, key };
        },
        onError: (_err, _vars, ctx) => {
            if (!ctx?.key) return;
            if (ctx.previous) queryClient.setQueryData(ctx.key, ctx.previous);
        },
        onSettled: (_data, _err, vars) => {
            if (!userId) return;
            const key = ['projects', vars.projectId, 'tasks', 'assignee', userId] as const;
            void queryClient.invalidateQueries({ queryKey: key });
        },
    });

    const filteredItems = React.useMemo(() => {
        if (selectedProjectId === 'all') return items;
        return items.filter((it) => it.projectId === selectedProjectId);
    }, [items, selectedProjectId]);

    const tasksByColumnKey = React.useMemo(() => {
        const map: Partial<Record<ProjectColumnKey, typeof filteredItems>> = {};
        for (const it of filteredItems) {
            const key = it.task.columnKey;
            (map[key] ??= []).push(it);
        }
        return map;
    }, [filteredItems]);

    const totalCount = filteredItems.length;
    const badgeCount = String(totalCount).padStart(2, '0');

    const calendar = React.useMemo(() => {
        const today = startOfLocalDay(new Date());
        const start = addDays(today, -3);
        const days = Array.from({ length: 8 }, (_, i) => addDays(start, i));
        const tasks = filteredItems
            .map((it) => {
                const dueRaw = it.task.dueDate;
                if (!dueRaw) return null;
                const due = new Date(dueRaw);
                if (Number.isNaN(due.getTime())) return null;
                const dueDay = startOfLocalDay(due);
                const index = Math.floor(
                    (dueDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
                );
                if (index < 0 || index >= days.length) return null;
                return { ...it, due, dayIndex: index };
            })
            .filter(Boolean) as Array<
            { task: Task; projectId: string; projectName: string; due: Date; dayIndex: number }
        >;

        const tasksByDay = new Map<number, typeof tasks>();
        for (const t of tasks) {
            const arr = tasksByDay.get(t.dayIndex) ?? [];
            arr.push(t);
            tasksByDay.set(t.dayIndex, arr);
        }

        for (const [k, arr] of tasksByDay) {
            arr.sort((a, b) => a.due.getTime() - b.due.getTime());
            tasksByDay.set(k, arr);
        }

        const todayIndex = days.findIndex((d) => sameLocalDay(d, today));

        return { days, todayIndex, tasksByDay };
    }, [filteredItems]);

    const getColumnItems = React.useCallback(
        (key: ProjectColumnKey) => tasksByColumnKey[key] ?? [],
        [tasksByColumnKey],
    );

    const todoItems = getColumnItems('backlog');
    const inProgressItems = getColumnItems('in_progress');
    const inReviewItems = getColumnItems('in_review');
    const doneItems = getColumnItems('done');

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
            const activeData = event.active.data.current as
                | { taskId: string; columnKey: ProjectColumnKey; projectId: string }
                | undefined;
            if (!activeData?.taskId) return;
            if (activeData.columnKey === nextColumnKey) return;

            transitionTaskMutation.mutate({
                taskId: activeData.taskId,
                projectId: activeData.projectId,
                nextColumnKey,
            });
        },
        [transitionTaskMutation],
    );

    const activeItem = React.useMemo(() => {
        if (!activeTaskId) return null;
        return filteredItems.find((it) => it.task.id === activeTaskId) ?? null;
    }, [activeTaskId, filteredItems]);

    const canCreate =
        Boolean(userId && createProjectId && createBoardId && createColumnKey && createTitle.trim().length > 0) &&
        !createTaskMutation.isPending;

    const canUpdate = Boolean(editing && editTitle.trim().length > 0) && !updateTaskMutation.isPending;

    return (
        <div className="flex h-full flex-col gap-6 p-2 overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20">
            {/* Task Calendar Section */}
            <Card className="shrink-0 p-4 flex flex-col gap-4 border-black/5 shadow-sm rounded-2xl mx-2 mt-2">
                <div className="flex items-center justify-between">
                    <h2 className="text-base font-semibold">Task Calendar</h2>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground border rounded-lg">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </div>

                {/* Timeline Calendar (API-backed) */}
                <div className="relative h-63 shrink-0 w-full border-t border-b overflow-hidden flex flex-col bg-white">
                    {/* Header Dates */}
                    <div className="grid grid-cols-8 w-full text-center text-[13px] font-medium text-muted-foreground mt-4 mb-2 z-10">
                        {calendar.days.map((d, idx) => {
                            const label = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                            const isToday = idx === calendar.todayIndex;
                            return (
                                <span key={d.toISOString()} className={isToday ? 'text-foreground font-bold' : undefined}>
                                    {label}
                                </span>
                            );
                        })}
                    </div>

                    <div className="relative flex-1 w-full border-t">
                        <div className="absolute inset-0 grid grid-cols-8">
                            {calendar.days.map((d, dayIndex) => {
                                const dayTasks = calendar.tasksByDay.get(dayIndex) ?? [];
                                const isToday = dayIndex === calendar.todayIndex;
                                return (
                                    <div key={d.toISOString()} className="border-l border-black/5 relative">
                                        {isToday && (
                                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-[1.5px] bg-foreground z-10">
                                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
                                            </div>
                                        )}

                                        {dayTasks.map((t, i) => {
                                            const top = 30 + i * 45;
                                            const dateLabel = d.toLocaleDateString(undefined, { day: '2-digit', month: 'short' });
                                            return (
                                                <div
                                                    key={t.task.id}
                                                    className="absolute left-1/2 -translate-x-1/2 bg-muted text-muted-foreground text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap max-w-[95%]"
                                                    style={{ top: `${top}px` }}
                                                    title={`${t.projectName}: ${t.task.title}`}
                                                >
                                                    <span className="font-semibold text-foreground">{dateLabel}</span>
                                                    <span className="truncate">{t.task.title}</span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })}
                        </div>

                        {filteredItems.length > 0 && calendar.tasksByDay.size === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                                No upcoming deadlines in this range.
                            </div>
                        )}

                        {filteredItems.length === 0 && !isLoading && !isError && (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
                                No tasks to display.
                            </div>
                        )}
                    </div>
                </div>
            </Card>

            {/* All Task Section */}
            <div className="flex flex-col gap-4 mt-2">
                <div className="flex items-center justify-between px-4">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold tracking-tight">All Task</h2>
                        <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                            <SelectTrigger className="w-50 h-8 rounded-lg">
                                <SelectValue placeholder="All projects" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All projects</SelectItem>
                                {projects.map((p) => (
                                    <SelectItem key={p.id} value={p.id}>
                                        {p.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex items-center bg-muted/50 p-1 rounded-xl">
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 rounded-lg px-3 text-xs">
                            <AlignJustify className="h-3.5 w-3.5 mr-2" />
                            Spreadsheet
                        </Button>
                        <Button variant="ghost" size="sm" className="text-muted-foreground h-8 rounded-lg px-3 text-xs">
                            <List className="h-3.5 w-3.5 mr-2" />
                            Timeline
                        </Button>
                        <Button variant="ghost" size="sm" className="bg-white shadow-sm h-8 rounded-lg px-3 font-semibold text-xs">
                            <Kanban className="h-3.5 w-3.5 mr-2" />
                            Kanban
                            <Badge className="ml-2 bg-muted text-muted-foreground hover:bg-muted font-normal h-4 text-[10px] px-1 rounded-sm border-none">{badgeCount}</Badge>
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 ml-1 text-muted-foreground">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {isLoading && (
                    <div className="px-4 text-sm text-muted-foreground">Loading tasks…</div>
                )}

                {isError && (
                    <div className="px-4 text-sm text-destructive">Failed to load tasks.</div>
                )}

                {!isLoading && !isError && items.length === 0 && (
                    <div className="px-4 text-sm text-muted-foreground">
                        No tasks assigned to you yet.
                    </div>
                )}

                {/* Kanban Board */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2 flex-1 pb-4">
                    <DndContext sensors={sensors} onDragStart={onDragStart} onDragCancel={() => setActiveTaskId(null)} onDragEnd={onDragEnd}>
                        <DroppableArea id="column:backlog">
                            <BoardColumn
                                title="To-do"
                                count={todoItems.length}
                                icon={<Clock className="h-3.5 w-3.5 text-foreground" />}
                                iconBgColor="bg-white shadow-sm"
                                onAdd={() => {
                                    setCreateColumnKey('backlog');
                                    setCreateTitle('');
                                    setCreateDescription('');
                                    setCreatePriority('medium');
                                    setCreateDueAt('');
                                    setCreateAssigneeId(userId ?? '');
                                    setCreateSubtasks([]);
                                    setCreateNewSubtaskTitle('');
                                }}
                            >
                                {todoItems.map(({ task, projectId, projectName }) => (
                                    <DraggableTask
                                        key={task.id}
                                        id={`task:${task.id}`}
                                        data={{ taskId: task.id, columnKey: task.columnKey, projectId }}
                                    >
                                        {({ isDragging }) => (
                                            <TaskCard
                                                projectTitle={projectName}
                                                deadline={formatDeadline(task.dueDate) || '—'}
                                                title={task.title}
                                                progress={calcProgress(task)}
                                                subtasksDone={countSubtasks(task).done}
                                                subtasksTotal={countSubtasks(task).total}
                                                isDragging={isDragging}
                                                onOpen={() => setEditing({ task, projectId, projectName })}
                                                onMenu={() => setDeleting({ task, projectId })}
                                            />
                                        )}
                                    </DraggableTask>
                                ))}
                            </BoardColumn>
                        </DroppableArea>

                        <DroppableArea id="column:in_progress">
                            <BoardColumn
                                title="In Progress"
                                count={inProgressItems.length}
                                icon={<PlayCircle className="h-3.5 w-3.5 text-blue-600" />}
                                iconBgColor="bg-blue-100"
                                titleColor="text-blue-600"
                                onAdd={() => {
                                    setCreateColumnKey('in_progress');
                                    setCreateTitle('');
                                    setCreateDescription('');
                                    setCreatePriority('medium');
                                    setCreateDueAt('');
                                    setCreateAssigneeId(userId ?? '');
                                    setCreateSubtasks([]);
                                    setCreateNewSubtaskTitle('');
                                }}
                            >
                                {inProgressItems.map(({ task, projectId, projectName }) => (
                                    <DraggableTask
                                        key={task.id}
                                        id={`task:${task.id}`}
                                        data={{ taskId: task.id, columnKey: task.columnKey, projectId }}
                                    >
                                        {({ isDragging }) => (
                                            <TaskCard
                                                projectTitle={projectName}
                                                deadline={formatDeadline(task.dueDate) || '—'}
                                                title={task.title}
                                                progress={calcProgress(task)}
                                                subtasksDone={countSubtasks(task).done}
                                                subtasksTotal={countSubtasks(task).total}
                                                isDragging={isDragging}
                                                onOpen={() => setEditing({ task, projectId, projectName })}
                                                onMenu={() => setDeleting({ task, projectId })}
                                            />
                                        )}
                                    </DraggableTask>
                                ))}
                            </BoardColumn>
                        </DroppableArea>

                        <DroppableArea id="column:in_review">
                            <BoardColumn
                                title="In Review"
                                count={inReviewItems.length}
                                icon={<Eye className="h-3.5 w-3.5 text-orange-600" />}
                                iconBgColor="bg-orange-100"
                                titleColor="text-orange-600"
                                onAdd={() => {
                                    setCreateColumnKey('in_review');
                                    setCreateTitle('');
                                    setCreateDescription('');
                                    setCreatePriority('medium');
                                    setCreateDueAt('');
                                    setCreateAssigneeId(userId ?? '');
                                    setCreateSubtasks([]);
                                    setCreateNewSubtaskTitle('');
                                }}
                            >
                                {inReviewItems.map(({ task, projectId, projectName }) => (
                                    <DraggableTask
                                        key={task.id}
                                        id={`task:${task.id}`}
                                        data={{ taskId: task.id, columnKey: task.columnKey, projectId }}
                                    >
                                        {({ isDragging }) => (
                                            <TaskCard
                                                projectTitle={projectName}
                                                deadline={formatDeadline(task.dueDate) || '—'}
                                                title={task.title}
                                                progress={calcProgress(task)}
                                                subtasksDone={countSubtasks(task).done}
                                                subtasksTotal={countSubtasks(task).total}
                                                isDragging={isDragging}
                                                onOpen={() => setEditing({ task, projectId, projectName })}
                                                onMenu={() => setDeleting({ task, projectId })}
                                            />
                                        )}
                                    </DraggableTask>
                                ))}
                            </BoardColumn>
                        </DroppableArea>

                        <DroppableArea id="column:done">
                            <BoardColumn
                                title="Completed"
                                count={doneItems.length}
                                icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                                iconBgColor="bg-emerald-100"
                                titleColor="text-emerald-600"
                                onAdd={() => {
                                    setCreateColumnKey('done');
                                    setCreateTitle('');
                                    setCreateDescription('');
                                    setCreatePriority('medium');
                                    setCreateDueAt('');
                                    setCreateAssigneeId(userId ?? '');
                                    setCreateSubtasks([]);
                                    setCreateNewSubtaskTitle('');
                                }}
                            >
                                {doneItems.map(({ task, projectId, projectName }) => (
                                    <DraggableTask
                                        key={task.id}
                                        id={`task:${task.id}`}
                                        data={{ taskId: task.id, columnKey: task.columnKey, projectId }}
                                    >
                                        {({ isDragging }) => (
                                            <TaskCard
                                                projectTitle={projectName}
                                                deadline={formatDeadline(task.dueDate) || '—'}
                                                title={task.title}
                                                progress={calcProgress(task)}
                                                subtasksDone={countSubtasks(task).done}
                                                subtasksTotal={countSubtasks(task).total}
                                                isDragging={isDragging}
                                                onOpen={() => setEditing({ task, projectId, projectName })}
                                                onMenu={() => setDeleting({ task, projectId })}
                                            />
                                        )}
                                    </DraggableTask>
                                ))}
                            </BoardColumn>
                        </DroppableArea>

                        {typeof document !== 'undefined' &&
                            createPortal(
                                <DragOverlay>
                                    {activeItem ? (
                                        <TaskCard
                                            projectTitle={activeItem.projectName}
                                            deadline={formatDeadline(activeItem.task.dueDate) || '—'}
                                            title={activeItem.task.title}
                                            progress={calcProgress(activeItem.task)}
                                            subtasksDone={countSubtasks(activeItem.task).done}
                                            subtasksTotal={countSubtasks(activeItem.task).total}
                                        />
                                    ) : null}
                                </DragOverlay>,
                                document.body,
                            )}
                    </DndContext>
                </div>
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
                            <label className="text-sm font-medium">Project</label>
                            <Select value={createProjectId} onValueChange={setCreateProjectId}>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select project" />
                                </SelectTrigger>
                                <SelectContent>
                                    {projects.map((p) => (
                                        <SelectItem key={p.id} value={p.id}>
                                            {p.name}
                                        </SelectItem>
                                    ))}
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
                                    {(createMembersQuery.data ?? ([] as PublicUser[])).map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                                        setCreateSubtasks((prev) => [...prev, { id: newLocalId(), title, isDone: false }]);
                                        setCreateNewSubtaskTitle('');
                                    }}
                                    disabled={!createNewSubtaskTitle.trim()}
                                >
                                    Add
                                </Button>
                            </div>
                        </div>

                        {boardsQuery.isError && (
                            <div className="text-sm text-destructive">
                                {(boardsQuery.error as Error)?.message ?? 'Failed to load project boards.'}
                            </div>
                        )}

                        {createMembersQuery.isError && (
                            <div className="text-sm text-destructive">
                                {(createMembersQuery.error as Error)?.message ?? 'Failed to load project members.'}
                            </div>
                        )}

                        {boardsQuery.data && boardsQuery.data.length === 0 && (
                            <div className="rounded-md border border-dashed p-3 text-sm">
                                <div className="text-muted-foreground">This project has no board yet.</div>
                                <div className="mt-2 flex items-center gap-2">
                                    <Button
                                        type="button"
                                        size="sm"
                                        onClick={() => createDefaultBoardMutation.mutate()}
                                        disabled={createDefaultBoardMutation.isPending}
                                    >
                                        {createDefaultBoardMutation.isPending ? 'Creating…' : 'Create board'}
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

            <Dialog open={Boolean(editing)} onOpenChange={(open) => (!open ? setEditing(null) : undefined)}>
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
                                    {(editMembersQuery.data ?? ([] as PublicUser[])).map((m) => (
                                        <SelectItem key={m.id} value={m.id}>
                                            {m.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

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
                                        setEditSubtasks((prev) => [...prev, { id: newLocalId(), title, isDone: false }]);
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

                        {editMembersQuery.isError && (
                            <div className="text-sm text-destructive">
                                {(editMembersQuery.error as Error)?.message ?? 'Failed to load project members.'}
                            </div>
                        )}

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    if (!editing) return;
                                    setDeleting({ task: editing.task, projectId: editing.projectId });
                                }}
                                disabled={!editing || deleteTaskMutation.isPending}
                            >
                                Delete
                            </Button>
                            <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={!canUpdate}>
                                {updateTaskMutation.isPending ? 'Saving…' : 'Save'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <AlertDialog open={Boolean(deleting)} onOpenChange={(open) => (!open ? setDeleting(null) : undefined)}>
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
