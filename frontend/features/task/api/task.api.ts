import { apiClient } from '@/shared/api/client';
import type { MongoIdLike } from '@/shared/types/api/project';
import type { CreateTaskInput, Task, TransitionTaskInput, UpdateTaskInput } from '@/shared/types/api/task';

function normalizeId<T extends MongoIdLike & Record<string, unknown>>(
  obj: T,
): T & { id: string } {
  const idValue = (obj as { id?: unknown }).id ?? (obj as { _id?: unknown })._id;
  if (typeof idValue !== 'string' || !idValue) {
    throw new Error('Invalid payload: missing id');
  }
  return { ...obj, id: idValue };
}

export const taskApi = {
  async listTasksByProject(params: {
    projectId: string;
    boardId?: string;
    columnKey?: string;
    assigneeId?: string;
  }): Promise<Task[]> {
    const { projectId, boardId, columnKey, assigneeId } = params;
    const res = await apiClient.get(`/projects/${projectId}/tasks`, {
      params: {
        ...(boardId ? { boardId } : {}),
        ...(columnKey ? { columnKey } : {}),
        ...(assigneeId ? { assigneeId } : {}),
      },
    });

    const items = Array.isArray(res.data) ? (res.data as Array<Record<string, unknown>>) : [];
    return items.map((t) =>
      normalizeId(t as Record<string, unknown> & MongoIdLike) as unknown as Task,
    );
  },

  async createTask(projectId: string, input: CreateTaskInput): Promise<Task> {
    const res = await apiClient.post(`/projects/${projectId}/tasks`, input);
    return normalizeId(res.data as Record<string, unknown> & MongoIdLike) as unknown as Task;
  },

  async getTask(taskId: string): Promise<Task> {
    const res = await apiClient.get(`/tasks/${taskId}`);
    return normalizeId(res.data as Record<string, unknown> & MongoIdLike) as unknown as Task;
  },

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const res = await apiClient.patch(`/tasks/${taskId}`, input);
    return normalizeId(res.data as Record<string, unknown> & MongoIdLike) as unknown as Task;
  },

  async transitionTask(taskId: string, input: TransitionTaskInput): Promise<Task> {
    const res = await apiClient.post(`/tasks/${taskId}/transition`, input);
    return normalizeId(res.data as Record<string, unknown> & MongoIdLike) as unknown as Task;
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};
