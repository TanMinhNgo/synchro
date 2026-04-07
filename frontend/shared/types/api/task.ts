import type { ProjectColumnKey } from './project';

export type TaskPriority = 'urgent' | 'high' | 'medium' | 'low';

export type Subtask = {
  id: string;
  title: string;
  isDone: boolean;
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
  assigneeId?: string;
  priority: TaskPriority;
  labelIds?: string[];
  subtasks?: CreateSubtaskInput[];
  order?: number;
};

export type UpdateTaskInput = {
  title?: string;
  description?: string;
  dueDate?: string;
  assigneeId?: string | null;
  priority?: TaskPriority;
  columnKey?: ProjectColumnKey;
  labelIds?: string[];
  subtasks?: UpdateSubtaskInput[];
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
  assigneeId?: string;
  priority: TaskPriority;
  labelIds: string[];
  subtasks: Subtask[];
  order: number;
  createdAt?: string;
  updatedAt?: string;
};
