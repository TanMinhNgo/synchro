import { apiClient } from '@/shared/api/client';
import type { MongoIdLike } from '@/shared/types/api/project';
import type {
  CreateNotificationInput,
  MarkReadInput,
  Notification,
} from '@/shared/types/api/notification';

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

export const notificationApi = {
  async list(params?: { unreadOnly?: boolean }): Promise<Notification[]> {
    const res = await apiClient.get('/notifications', {
      params: params?.unreadOnly ? { unreadOnly: 'true' } : {},
    });

    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];

    return items.map(
      (n) =>
        normalizeId(
          n as Record<string, unknown> & MongoIdLike,
        ) as unknown as Notification,
    );
  },

  async create(input: CreateNotificationInput): Promise<Notification> {
    const res = await apiClient.post('/notifications', input);
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as Notification;
  },

  async markRead(
    notificationId: string,
    input: MarkReadInput,
  ): Promise<Notification> {
    const res = await apiClient.post(
      `/notifications/${notificationId}/read`,
      input,
    );
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as Notification;
  },

  async markAllRead(): Promise<{ ok: boolean } | void> {
    const res = await apiClient.post('/notifications/read-all');
    return res.data;
  },
};
