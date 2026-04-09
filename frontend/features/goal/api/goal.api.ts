import { apiClient } from '@/shared/api/client';
import type { MongoIdLike } from '@/shared/types/api/project';
import type { CreateGoalInput, Goal, UpdateGoalInput } from '@/shared/types/api/goal';

function normalizeId<T extends MongoIdLike & Record<string, unknown>>(
  obj: T,
): T & { id: string } {
  const idValue = (obj as { id?: unknown }).id ?? (obj as { _id?: unknown })._id;
  if (typeof idValue !== 'string' || !idValue) {
    throw new Error('Invalid payload: missing id');
  }
  return { ...obj, id: idValue };
}

export const goalApi = {
  async list(): Promise<Goal[]> {
    const res = await apiClient.get('/goals');
    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items.map((g) =>
      normalizeId(g as Record<string, unknown> & MongoIdLike) as unknown as Goal,
    );
  },

  async create(input: CreateGoalInput): Promise<Goal> {
    const res = await apiClient.post('/goals', input);
    return normalizeId(res.data as Record<string, unknown> & MongoIdLike) as unknown as Goal;
  },

  async update(goalId: string, input: UpdateGoalInput): Promise<Goal> {
    const res = await apiClient.patch(`/goals/${goalId}`, input);
    return normalizeId(res.data as Record<string, unknown> & MongoIdLike) as unknown as Goal;
  },

  async remove(goalId: string): Promise<{ ok: boolean } | void> {
    const res = await apiClient.delete(`/goals/${goalId}`);
    return res.data;
  },
};
