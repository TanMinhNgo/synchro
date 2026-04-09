'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { useMyTasksKanban } from '@/features/task/hooks/useMyTasksKanban';
import type { ProjectColumnKey } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';
import { TaskCalendarCard } from './_components/TaskCalendarCard';
import { TasksHeader } from './_components/TasksHeader';
import { TaskKanbanBoard } from './_components/TaskKanbanBoard';
import { CreateTaskDialog } from './_components/CreateTaskDialog';
import { EditTaskDialog } from './_components/EditTaskDialog';
import { DeleteTaskAlert } from './_components/DeleteTaskAlert';

export default function MyTasksPage() {
    const { isLoading, isError, items, currentUserQuery, projectsQuery } = useMyTasksKanban();

    const searchParams = useSearchParams();
    const search = (searchParams.get('search') ?? '').trim().toLowerCase();

    const userId = currentUserQuery.data?.id;
    const projects = React.useMemo(() => projectsQuery.data ?? [], [projectsQuery.data]);

    const [selectedProjectId, setSelectedProjectId] = React.useState<string>('all');

    const [createColumnKey, setCreateColumnKey] = React.useState<ProjectColumnKey | null>(null);
    const [editing, setEditing] = React.useState<{ task: Task; projectId: string; projectName: string } | null>(null);
    const [deleting, setDeleting] = React.useState<{ task: Task; projectId: string } | null>(null);

    const filteredItems = React.useMemo(() => {
        let next = items;
        if (selectedProjectId !== 'all') {
            next = next.filter((it) => it.projectId === selectedProjectId);
        }
        if (search) {
            next = next.filter((it) => {
                const title = (it.task.title ?? '').toLowerCase();
                const desc = (it.task.description ?? '').toLowerCase();
                const projectName = (it.projectName ?? '').toLowerCase();
                return title.includes(search) || desc.includes(search) || projectName.includes(search);
            });
        }
        return next;
    }, [items, search, selectedProjectId]);
    const totalCount = filteredItems.length;
    const badgeCount = String(totalCount).padStart(2, '0');

    return (
        <div className="flex h-full flex-col gap-6 p-2">
            <TaskCalendarCard items={filteredItems} isLoading={isLoading} isError={isError} />

            {/* All Task Section */}
            <div className="flex flex-col gap-4 mt-2">
                <TasksHeader
                    selectedProjectId={selectedProjectId}
                    onSelectedProjectIdChange={setSelectedProjectId}
                    projects={projects}
                    badgeCount={badgeCount}
                />

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

                <TaskKanbanBoard
                    items={filteredItems}
                    userId={userId}
                    onAdd={(columnKey) => setCreateColumnKey(columnKey)}
                    onOpen={({ task, projectId, projectName }) => setEditing({ task, projectId, projectName })}
                    onDelete={({ task, projectId }) => setDeleting({ task, projectId })}
                />
            </div>

            <CreateTaskDialog
                open={createColumnKey !== null}
                columnKey={createColumnKey}
                onClose={() => setCreateColumnKey(null)}
                userId={userId}
                projects={projects}
                selectedProjectId={selectedProjectId}
            />

            <EditTaskDialog
                editing={editing}
                onClose={() => setEditing(null)}
                userId={userId}
                onRequestDelete={({ task, projectId }) => setDeleting({ task, projectId })}
            />

            <DeleteTaskAlert
                deleting={deleting}
                onClose={() => setDeleting(null)}
                userId={userId}
                onDeleted={(deletedTaskId) => {
                    setDeleting(null);
                    setEditing((prev) => (prev?.task.id === deletedTaskId ? null : prev));
                }}
            />
        </div>
    );
}
