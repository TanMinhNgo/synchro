import { apiClient } from '@/shared/api/client';
import type { MongoIdLike } from '@/shared/types/api/project';
import type {
  CreateTaskInput,
  Task,
  TransitionTaskInput,
  UpdateTaskInput,
} from '@/shared/types/api/task';

function normalizeId<T extends MongoIdLike & Record<string, unknown>>(
  obj: T,
): T & { id: string } {
  const idValue =
    (obj as { id?: unknown }).id ?? (obj as { _id?: unknown })._id;
  if (typeof idValue !== 'string' || !idValue) {
    throw new Error('Invalid payload: missing id');
  }
  return { ...obj, id: idValue };
}

function normalizeTask(obj: Record<string, unknown> & MongoIdLike): Task {
  const withId = normalizeId(obj) as Record<string, unknown> & { id: string };

  const legacyAssigneeId =
    typeof withId.assigneeId === 'string' && withId.assigneeId
      ? withId.assigneeId
      : undefined;

  const assigneeIds = Array.isArray(withId.assigneeIds)
    ? (withId.assigneeIds.filter(
        (v) => typeof v === 'string' && v.length > 0,
      ) as string[])
    : legacyAssigneeId
      ? [legacyAssigneeId]
      : [];

  const attachments = Array.isArray(withId.attachments)
    ? (withId.attachments
        .filter(
          (a) =>
            a &&
            typeof a === 'object' &&
            typeof (a as { url?: unknown }).url === 'string' &&
            ((a as { url: string }).url ?? '').length > 0,
        )
        .map((a) => ({
          url: String((a as { url: string }).url),
          ...(typeof (a as { title?: unknown }).title === 'string' &&
          (a as { title: string }).title
            ? { title: String((a as { title: string }).title) }
            : {}),
        })) as Task['attachments'])
    : [];

  return {
    ...(withId as unknown as Task),
    assigneeIds,
    attachments,
  };
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

    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items.map((t) =>
      normalizeTask(t as Record<string, unknown> & MongoIdLike),
    );
  },

  async createTask(projectId: string, input: CreateTaskInput): Promise<Task> {
    const res = await apiClient.post(`/projects/${projectId}/tasks`, input);
    return normalizeTask(res.data as Record<string, unknown> & MongoIdLike);
  },

  async getTask(taskId: string): Promise<Task> {
    const res = await apiClient.get(`/tasks/${taskId}`);
    return normalizeTask(res.data as Record<string, unknown> & MongoIdLike);
  },

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const res = await apiClient.patch(`/tasks/${taskId}`, input);
    return normalizeTask(res.data as Record<string, unknown> & MongoIdLike);
  },

  async transitionTask(
    taskId: string,
    input: TransitionTaskInput,
  ): Promise<Task> {
    const res = await apiClient.post(`/tasks/${taskId}/transition`, input);
    return normalizeTask(res.data as Record<string, unknown> & MongoIdLike);
  },

  async deleteTask(taskId: string): Promise<void> {
    await apiClient.delete(`/tasks/${taskId}`);
  },
};
