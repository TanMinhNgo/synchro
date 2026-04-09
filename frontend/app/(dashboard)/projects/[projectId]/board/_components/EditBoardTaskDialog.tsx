'use client';

import * as React from 'react';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { X } from 'lucide-react';
import { useUpdateTask } from '@/features/task/hooks/use-update-task';
import { useProjectMembers } from '@/features/project/hooks/use-project-members';
import type { Task } from '@/shared/types/api/task';
import type { PublicUser } from '@/shared/types/api/user';
import { datetimeLocalToIso, isoToDatetimeLocal, newLocalId } from './task-utils';

type SubtaskDraft = { id: string; title: string; isDone: boolean };
type AttachmentDraft = { id: string; url: string; title: string };

export function EditBoardTaskDialog({
  editingTask,
  projectId,
  boardId,
  onClose,
  onRequestDelete,
}: {
  editingTask: Task | null;
  projectId: string;
  boardId?: string;
  onClose: () => void;
  onRequestDelete: (task: Task) => void;
}) {
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [priority, setPriority] = React.useState<Task['priority']>('medium');
  const [dueAt, setDueAt] = React.useState('');
  const [assigneeIds, setAssigneeIds] = React.useState<string[]>([]);
  const [subtasks, setSubtasks] = React.useState<SubtaskDraft[]>([]);
  const [newSubtaskTitle, setNewSubtaskTitle] = React.useState('');
  const [attachments, setAttachments] = React.useState<AttachmentDraft[]>([]);
  const [newAttachmentUrl, setNewAttachmentUrl] = React.useState('');
  const [newAttachmentTitle, setNewAttachmentTitle] = React.useState('');

  React.useEffect(() => {
    if (!editingTask) return;
    setTitle(editingTask.title ?? '');
    setDescription(editingTask.description ?? '');
    setPriority(editingTask.priority ?? 'medium');
    setDueAt(isoToDatetimeLocal(editingTask.dueDate));
    setAssigneeIds(() => {
      const fromArray = Array.isArray(editingTask.assigneeIds) ? editingTask.assigneeIds : [];
      if (fromArray.length > 0) return fromArray;
      return editingTask.assigneeId ? [editingTask.assigneeId] : [];
    });
    setSubtasks((editingTask.subtasks ?? []).map((s) => ({ ...s })));
    setNewSubtaskTitle('');
    setAttachments((editingTask.attachments ?? []).map((a) => ({ id: newLocalId(), url: a.url, title: a.title ?? '' })));
    setNewAttachmentUrl('');
    setNewAttachmentTitle('');
  }, [editingTask]);

  const membersQuery = useProjectMembers(projectId, {
    enabled: Boolean(projectId),
    staleTime: 10_000,
  });
  const members = (membersQuery.data ?? []) as PublicUser[];

  const selectedAssignees = React.useMemo(() => {
    if (assigneeIds.length === 0) return [] as PublicUser[];
    const map = new Map(members.map((m) => [m.id, m] as const));
    return assigneeIds.map((id) => map.get(id)).filter(Boolean) as PublicUser[];
  }, [assigneeIds, members]);

  const boardTasksQueryKey = React.useMemo(() => {
    if (!boardId) return null;
    return ['projects', projectId, 'boards', boardId, 'tasks'] as const;
  }, [boardId, projectId]);

  const updateTaskMutation = useUpdateTask({
    listQueryKey: boardTasksQueryKey ?? undefined,
    onSuccess: () => {
      onClose();
    },
  });

  const canUpdate = Boolean(editingTask && title.trim().length > 0) && !updateTaskMutation.isPending;

  return (
    <Dialog open={Boolean(editingTask)} onOpenChange={(open) => (!open ? onClose() : undefined)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Task</DialogTitle>
        </DialogHeader>
        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            if (!canUpdate) return;
            if (!editingTask) return;

            const dueDate = datetimeLocalToIso(dueAt);
            const mappedSubtasks = subtasks.map((s) => ({ id: s.id, title: s.title, isDone: s.isDone }));
            const hadAnyAssignee =
              (Array.isArray(editingTask.assigneeIds) && editingTask.assigneeIds.length > 0) ||
              Boolean(editingTask.assigneeId);

            const shouldSetAssigneeIds = assigneeIds.length > 0 || hadAnyAssignee;
            const mappedAttachments = (attachments ?? [])
              .map((a) => ({ url: a.url.trim(), title: a.title.trim() }))
              .filter((a) => a.url.length > 0)
              .map((a) => ({ url: a.url, ...(a.title ? { title: a.title } : {}) }));
            const hadAnyAttachments = (editingTask.attachments?.length ?? 0) > 0;
            const shouldSetAttachments = mappedAttachments.length > 0 || hadAnyAttachments;

            updateTaskMutation.mutate({
              taskId: editingTask.id,
              title,
              description,
              priority,
              ...(shouldSetAssigneeIds ? { assigneeIds } : {}),
              ...(dueDate ? { dueDate } : {}),
              subtasks: mappedSubtasks,
              ...(shouldSetAttachments ? { attachments: mappedAttachments } : {}),
            });
          }}
        >
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Title</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Description</label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Priority</label>
            <Select value={priority} onValueChange={(v) => setPriority(v as Task['priority'])}>
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
            <label className="text-sm font-medium">Assignees</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button type="button" variant="outline" className="w-full justify-start gap-2 h-auto min-h-10 flex-wrap">
                  {selectedAssignees.length > 0 ? (
                    selectedAssignees.map((a) => (
                      <span
                        key={a.id}
                        className="inline-flex items-center gap-1 rounded-full border border-input bg-background px-3 py-1 text-sm"
                      >
                        <span className="max-w-40 truncate">{a.name}</span>
                        <button
                          type="button"
                          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setAssigneeIds((prev) => prev.filter((id) => id !== a.id));
                          }}
                          aria-label={`Remove ${a.name}`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-muted-foreground">Unassigned</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-2">
                <div className="flex max-h-56 flex-col gap-2 overflow-auto">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={assigneeIds.length === 0}
                      onCheckedChange={(checked) => {
                        if (checked === true) setAssigneeIds([]);
                      }}
                    />
                    <span className="text-sm">Unassigned</span>
                  </div>

                  {members.map((m) => {
                    const checked = assigneeIds.includes(m.id);
                    return (
                      <div key={m.id} className="flex items-center gap-2">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(next) => {
                            const isChecked = next === true;
                            setAssigneeIds((prev) => {
                              if (isChecked) return Array.from(new Set([...prev, m.id]));
                              return prev.filter((id) => id !== m.id);
                            });
                          }}
                        />
                        <span className="text-sm">{m.name}</span>
                      </div>
                    );
                  })}
                </div>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Deadline</label>
            <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Subtasks</label>
            <div className="flex flex-col gap-2">
              {subtasks.map((s) => (
                <div key={s.id} className="flex items-center gap-2">
                  <Checkbox
                    checked={s.isDone}
                    onCheckedChange={(checked) => {
                      const isDone = checked === true;
                      setSubtasks((prev) => prev.map((p) => (p.id === s.id ? { ...p, isDone } : p)));
                    }}
                  />
                  <Input
                    value={s.title}
                    onChange={(e) => {
                      const nextTitle = e.target.value;
                      setSubtasks((prev) => prev.map((p) => (p.id === s.id ? { ...p, title: nextTitle } : p)));
                    }}
                  />
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSubtasks((prev) => prev.filter((p) => p.id !== s.id))}>
                    Remove
                  </Button>
                </div>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <Input value={newSubtaskTitle} onChange={(e) => setNewSubtaskTitle(e.target.value)} placeholder="New subtask" />
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => {
                  const nextTitle = newSubtaskTitle.trim();
                  if (!nextTitle) return;
                  setSubtasks((prev) => [...prev, { id: newLocalId(), title: nextTitle, isDone: false }]);
                  setNewSubtaskTitle('');
                }}
                disabled={!newSubtaskTitle.trim()}
              >
                Add
              </Button>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium">Attachments</label>
            <div className="flex flex-col gap-2">
              {attachments.map((a) => (
                <div key={a.id} className="grid grid-cols-1 gap-2 md:grid-cols-3">
                  <Input
                    value={a.title}
                    onChange={(e) => {
                      const title = e.target.value;
                      setAttachments((prev) => prev.map((p) => (p.id === a.id ? { ...p, title } : p)));
                    }}
                    placeholder="Title (optional)"
                  />
                  <div className="md:col-span-2 flex gap-2">
                    <Input
                      value={a.url}
                      onChange={(e) => {
                        const url = e.target.value;
                        setAttachments((prev) => prev.map((p) => (p.id === a.id ? { ...p, url } : p)));
                      }}
                      placeholder="https://..."
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setAttachments((prev) => prev.filter((p) => p.id !== a.id))}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
              <Input
                value={newAttachmentTitle}
                onChange={(e) => setNewAttachmentTitle(e.target.value)}
                placeholder="Title (optional)"
              />
              <div className="md:col-span-2 flex gap-2">
                <Input
                  value={newAttachmentUrl}
                  onChange={(e) => setNewAttachmentUrl(e.target.value)}
                  placeholder="https://..."
                />
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const url = newAttachmentUrl.trim();
                    if (!url) return;
                    setAttachments((prev) => [
                      ...prev,
                      { id: newLocalId(), url, title: newAttachmentTitle.trim() },
                    ]);
                    setNewAttachmentUrl('');
                    setNewAttachmentTitle('');
                  }}
                  disabled={!newAttachmentUrl.trim()}
                >
                  Add
                </Button>
              </div>
            </div>
          </div>

          {updateTaskMutation.isError && (
            <div className="text-sm text-destructive">
              {(updateTaskMutation.error as Error)?.message ?? 'Failed to update task.'}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => (editingTask ? onRequestDelete(editingTask) : undefined)}>
              Delete
            </Button>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canUpdate}>
              {updateTaskMutation.isPending ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
