import type { ProjectColumnKey } from './project';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type Subtask = {
  id: string;
  title: string;
  isDone: boolean;
};

export type TaskAttachment = {
  url: string;
  title?: string;
};

export type CreateSubtaskInput = {
  title: string;
  isDone?: boolean;
};

export type UpdateSubtaskInput = {
  id?: string;
  title?: string;
  isDone?: boolean;
};

export type CreateTaskInput = {
  boardId: string;
  columnKey: ProjectColumnKey;
  title: string;
  description?: string;
  dueDate?: string;
  /** @deprecated Prefer assigneeIds */
  assigneeId?: string;
  assigneeIds?: string[];
  priority: TaskPriority;
  labelIds?: string[];
  subtasks?: CreateSubtaskInput[];
  attachments?: TaskAttachment[];
  order?: number;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  dueDate?: string;
  /** @deprecated Prefer assigneeIds */
  assigneeId?: string | null;
  assigneeIds?: string[];
  priority?: TaskPriority;
  columnKey?: ProjectColumnKey;
  labelIds?: string[];
  subtasks?: UpdateSubtaskInput[];
  attachments?: TaskAttachment[];
  order?: number;
};

export type TransitionTaskInput = {
  columnKey: ProjectColumnKey;
};

export type Task = {
  id: string;
  projectId: string;
  boardId: string;
  columnKey: ProjectColumnKey;
  title: string;
  description?: string;
  dueDate?: string;
  createdBy: string;
  /** @deprecated Prefer assigneeIds */
  assigneeId?: string | null;
  assigneeIds?: string[];
  priority: TaskPriority;
  labelIds: string[];
  subtasks: Subtask[];
  attachments?: TaskAttachment[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
};
