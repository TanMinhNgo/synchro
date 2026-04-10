import { apiClient } from '@/shared/api/client';
import type {
  Board,
  CreateBoardInput,
  CreateColumnInput,
  CreateLabelInput,
  CreateProjectInput,
  MongoIdLike,
  Project,
  ProjectColumn,
  ProjectLabel,
  UpdateColumnInput,
  UpdateProjectInput,
} from '@/shared/types/api/project';
import type { PublicUser } from '@/shared/types/api/user';

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

export const projectApi = {
  async listProjects(): Promise<Project[]> {
    const res = await apiClient.get('/projects');
    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items.map(
      (p) =>
        normalizeId(
          p as Record<string, unknown> & MongoIdLike,
        ) as unknown as Project,
    );
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const res = await apiClient.post('/projects', input);
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as Project;
  },

  async getProject(projectId: string): Promise<Project> {
    const res = await apiClient.get(`/projects/${projectId}`);
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as Project;
  },

  async updateProject(
    projectId: string,
    input: UpdateProjectInput,
  ): Promise<Project> {
    const res = await apiClient.patch(`/projects/${projectId}`, input);
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as Project;
  },

  async deleteProject(projectId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}`);
  },

  async listBoards(projectId: string): Promise<Board[]> {
    const res = await apiClient.get(`/projects/${projectId}/boards`);
    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items.map(
      (b) =>
        normalizeId(
          b as Record<string, unknown> & MongoIdLike,
        ) as unknown as Board,
    );
  },

  async createBoard(
    projectId: string,
    input: CreateBoardInput,
  ): Promise<Board> {
    const res = await apiClient.post(`/projects/${projectId}/boards`, input);
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as Board;
  },

  async listColumns(
    projectId: string,
    boardId: string,
  ): Promise<ProjectColumn[]> {
    const res = await apiClient.get(
      `/projects/${projectId}/boards/${boardId}/columns`,
    );
    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items.map(
      (c) =>
        normalizeId(
          c as Record<string, unknown> & MongoIdLike,
        ) as unknown as ProjectColumn,
    );
  },

  async createColumn(
    projectId: string,
    boardId: string,
    input: CreateColumnInput,
  ): Promise<ProjectColumn> {
    const res = await apiClient.post(
      `/projects/${projectId}/boards/${boardId}/columns`,
      input,
    );
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as ProjectColumn;
  },

  async updateColumn(
    projectId: string,
    boardId: string,
    columnId: string,
    input: UpdateColumnInput,
  ): Promise<ProjectColumn> {
    const res = await apiClient.patch(
      `/projects/${projectId}/boards/${boardId}/columns/${columnId}`,
      input,
    );
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as ProjectColumn;
  },

  async listLabels(projectId: string): Promise<ProjectLabel[]> {
    const res = await apiClient.get(`/projects/${projectId}/labels`);
    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items.map(
      (l) =>
        normalizeId(
          l as Record<string, unknown> & MongoIdLike,
        ) as unknown as ProjectLabel,
    );
  },

  async createLabel(
    projectId: string,
    input: CreateLabelInput,
  ): Promise<ProjectLabel> {
    const res = await apiClient.post(`/projects/${projectId}/labels`, input);
    return normalizeId(
      res.data as Record<string, unknown> & MongoIdLike,
    ) as unknown as ProjectLabel;
  },

  async deleteLabel(projectId: string, labelId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/labels/${labelId}`);
  },

  async listProjectMembers(projectId: string): Promise<PublicUser[]> {
    const res = await apiClient.get(`/projects/${projectId}/members`);
    const items = Array.isArray(res.data)
      ? (res.data as Array<Record<string, unknown>>)
      : [];
    return items
      .map((u) => normalizeId(u as Record<string, unknown> & MongoIdLike))
      .map((u) => ({
        id: u.id,
        email: String(u.email ?? ''),
        name: String(u.name ?? ''),
        avatarUrl: typeof u.avatarUrl === 'string' ? u.avatarUrl : undefined,
      }))
      .filter((u) => u.id && u.name && u.email);
  },

  async inviteMember(projectId: string, email: string): Promise<void> {
    await apiClient.post(`/projects/${projectId}/invite`, { email });
  },
};
