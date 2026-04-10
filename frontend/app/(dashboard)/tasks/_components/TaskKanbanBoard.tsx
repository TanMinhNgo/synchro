'use client';

import * as React from 'react';
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
import { toast } from 'sonner';
import { BoardColumn } from '@/components/organisms/BoardColumn';
import { TaskCard } from '@/components/molecules/TaskCard';
import { CheckCircle2, Clock, Eye, PlayCircle } from 'lucide-react';
import { useTransitionTask } from '@/features/task/hooks/use-transition-task';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';
import { calcProgress, countSubtasks, formatDeadline } from './task-utils';

type Item = { task: Task; projectId: string; projectName: string };

type ActiveData = {
  taskId: string;
  columnKey: ProjectColumnKey;
  projectId: string;
};

function DroppableArea({
  id,
  children,
}: {
  id: string;
  children: React.ReactNode;
}) {
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
  data: ActiveData;
  children: (args: { isDragging: boolean }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
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

export function TaskKanbanBoard({
  items,
  userId,
  onAdd,
  onOpen,
  onDelete,
}: {
  items: Item[];
  userId?: string;
  onAdd: (columnKey: ProjectColumnKey) => void;
  onOpen: (args: {
    task: Task;
    projectId: string;
    projectName: string;
  }) => void;
  onDelete: (args: { task: Task; projectId: string }) => void;
}) {
  const transitionTaskMutation = useTransitionTask({
    getListQueryKey: (vars) =>
      userId && vars.projectId
        ? (['projects', vars.projectId, 'tasks', 'assignee', userId] as const)
        : undefined,
  });

  const tasksByColumnKey = React.useMemo(() => {
    const map: Partial<Record<ProjectColumnKey, Item[]>> = {};
    for (const it of items) {
      const key = it.task.columnKey;
      (map[key] ??= []).push(it);
    }
    return map;
  }, [items]);

  const getColumnItems = React.useCallback(
    (key: ProjectColumnKey) => tasksByColumnKey[key] ?? [],
    [tasksByColumnKey],
  );

  const columns = React.useMemo(
    () =>
      [
        {
          key: 'backlog' as const,
          title: 'To-do',
          icon: <Clock className="h-3.5 w-3.5 text-foreground" />,
          iconBgColor: 'bg-white shadow-sm',
        },
        {
          key: 'in_progress' as const,
          title: 'In Progress',
          icon: <PlayCircle className="h-3.5 w-3.5 text-blue-600" />,
          iconBgColor: 'bg-blue-100',
          titleColor: 'text-blue-600',
        },
        {
          key: 'in_review' as const,
          title: 'In Review',
          icon: <Eye className="h-3.5 w-3.5 text-orange-600" />,
          iconBgColor: 'bg-orange-100',
          titleColor: 'text-orange-600',
        },
        {
          key: 'done' as const,
          title: 'Completed',
          icon: <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />,
          iconBgColor: 'bg-emerald-100',
          titleColor: 'text-emerald-600',
        },
      ] satisfies Array<{
        key: ProjectColumnKey;
        title: string;
        icon: React.ReactNode;
        iconBgColor: string;
        titleColor?: string;
      }>,
    [],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
  );

  const [activeTaskId, setActiveTaskId] = React.useState<string | null>(null);

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
      const activeData = event.active.data.current as ActiveData | undefined;
      if (!activeData?.taskId) return;
      if (activeData.columnKey === nextColumnKey) return;

      if (nextColumnKey === 'done') {
        const item = items.find((it) => it.task.id === activeData.taskId);
        const subtasks = item?.task.subtasks ?? [];
        if (subtasks.length > 0 && subtasks.some((s) => !s.isDone)) {
          toast.error('Complete all subtasks before moving to Completed.');
          return;
        }
      }

      transitionTaskMutation.mutate({
        taskId: activeData.taskId,
        projectId: activeData.projectId,
        nextColumnKey,
      });
    },
    [items, transitionTaskMutation],
  );

  const activeItem = React.useMemo(() => {
    if (!activeTaskId) return null;
    return items.find((it) => it.task.id === activeTaskId) ?? null;
  }, [activeTaskId, items]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 px-2 flex-1 pb-4">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragCancel={() => setActiveTaskId(null)}
        onDragEnd={onDragEnd}
      >
        {columns.map((col) => {
          const columnItems = getColumnItems(col.key);
          return (
            <DroppableArea key={col.key} id={`column:${col.key}`}>
              <BoardColumn
                title={col.title}
                count={columnItems.length}
                icon={col.icon}
                iconBgColor={col.iconBgColor}
                titleColor={col.titleColor}
                onAdd={() => onAdd(col.key)}
              >
                {columnItems.map(({ task, projectId, projectName }) => (
                  <DraggableTask
                    key={task.id}
                    id={`task:${task.id}`}
                    data={{
                      taskId: task.id,
                      columnKey: task.columnKey,
                      projectId,
                    }}
                  >
                    {({ isDragging }) => (
                      <TaskCard
                        projectTitle={projectName}
                        deadline={formatDeadline(task.dueDate) || '—'}
                        title={task.title}
                        priority={task.priority}
                        progress={calcProgress(task)}
                        subtasksDone={countSubtasks(task).done}
                        subtasksTotal={countSubtasks(task).total}
                        assigneeKeys={task.assigneeIds ?? []}
                        links={task.attachments?.length ?? 0}
                        isDragging={isDragging}
                        onOpen={() => onOpen({ task, projectId, projectName })}
                        onMenu={() => onDelete({ task, projectId })}
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
              {activeItem ? (
                <TaskCard
                  projectTitle={activeItem.projectName}
                  deadline={formatDeadline(activeItem.task.dueDate) || '—'}
                  title={activeItem.task.title}
                  priority={activeItem.task.priority}
                  progress={calcProgress(activeItem.task)}
                  subtasksDone={countSubtasks(activeItem.task).done}
                  subtasksTotal={countSubtasks(activeItem.task).total}
                  assigneeKeys={activeItem.task.assigneeIds ?? []}
                  links={activeItem.task.attachments?.length ?? 0}
                />
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </div>
  );
}
