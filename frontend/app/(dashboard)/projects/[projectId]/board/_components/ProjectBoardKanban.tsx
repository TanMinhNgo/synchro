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
import { useTransitionTask } from '@/features/task/hooks/use-transition-task';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';
import { calcProgress, countSubtasks, formatDeadline } from './task-utils';

type Column = { id: string; key: ProjectColumnKey; name: string; order?: number | null };

function DroppableArea({ id, children }: { id: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div ref={setNodeRef} className={isOver ? 'rounded-xl ring-1 ring-ring/40' : undefined}>
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

export function ProjectBoardKanban({
  projectName,
  projectId,
  boardId,
  columns,
  tasks,
  onAdd,
  onOpen,
  onDelete,
}: {
  projectName: string;
  projectId: string;
  boardId?: string;
  columns: Column[];
  tasks?: Task[];
  onAdd: (columnKey: ProjectColumnKey) => void;
  onOpen: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const boardTasksQueryKey = React.useMemo(() => {
    if (!boardId) return null;
    return ['projects', projectId, 'boards', boardId, 'tasks'] as const;
  }, [boardId, projectId]);

  const transitionTaskMutation = useTransitionTask({
    listQueryKey: boardTasksQueryKey ?? undefined,
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
      const activeData = event.active.data.current as { taskId: string; columnKey: ProjectColumnKey } | undefined;
      if (!activeData?.taskId) return;
      if (activeData.columnKey === nextColumnKey) return;

      if (nextColumnKey === 'done') {
        const task = (tasks ?? []).find((t) => t.id === activeData.taskId);
        const subtasks = task?.subtasks ?? [];
        if (subtasks.length > 0 && subtasks.some((s) => !s.isDone)) {
          toast.error('Complete all subtasks before moving to Completed.');
          return;
        }
      }

      transitionTaskMutation.mutate({ taskId: activeData.taskId, nextColumnKey });
    },
    [tasks, transitionTaskMutation],
  );

  const activeTask = React.useMemo(() => {
    if (!activeTaskId) return null;
    return (tasks ?? []).find((t) => t.id === activeTaskId) ?? null;
  }, [activeTaskId, tasks]);

  const sortedColumns = React.useMemo(
    () => columns.slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [columns],
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-1 pb-4">
      <DndContext
        sensors={sensors}
        onDragStart={onDragStart}
        onDragCancel={() => setActiveTaskId(null)}
        onDragEnd={onDragEnd}
      >
        {sortedColumns.map((col) => {
          const colTasks = tasksByColumnKey[col.key] ?? [];
          return (
            <DroppableArea key={col.id} id={`column:${col.key}`}>
              <BoardColumn
                title={col.name}
                count={colTasks.length}
                onAdd={() => onAdd(col.key)}
              >
                {colTasks.map((t) => (
                  <DraggableTask key={t.id} id={`task:${t.id}`} data={{ taskId: t.id, columnKey: t.columnKey }}>
                    {({ isDragging }) => (
                      <TaskCard
                        projectTitle={projectName}
                        deadline={formatDeadline(t.dueDate) || '—'}
                        title={t.title}
                        priority={t.priority}
                        progress={calcProgress(t)}
                        subtasksDone={countSubtasks(t).done}
                        subtasksTotal={countSubtasks(t).total}
                        assigneeKeys={t.assigneeIds ?? []}
                        links={t.attachments?.length ?? 0}
                        isDragging={isDragging}
                        onOpen={() => onOpen(t)}
                        onMenu={() => onDelete(t)}
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
                  priority={activeTask.priority}
                  progress={calcProgress(activeTask)}
                  subtasksDone={countSubtasks(activeTask).done}
                  subtasksTotal={countSubtasks(activeTask).total}
                  assigneeKeys={activeTask.assigneeIds ?? []}
                  links={activeTask.attachments?.length ?? 0}
                />
              ) : null}
            </DragOverlay>,
            document.body,
          )}
      </DndContext>
    </div>
  );
}
