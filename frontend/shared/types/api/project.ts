export type MongoIdLike = {
  id?: string;
  _id?: string;
};

export type ProjectStatus = 'ACTIVE' | 'ARCHIVED';

export type ProjectColumnKey = 'backlog' | 'in_progress' | 'in_review' | 'done';

export type Project = {
  id: string;
  slug?: string;
  name: string;
  description?: string;
  ownerId: string;
  memberIds: string[];
  status: ProjectStatus;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectLabel = {
  id: string;
  projectId: string;
  name: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateProjectInput = {
  name: string;
  description?: string;
  memberIds?: string[];
};

export type UpdateProjectInput = {
  name?: string;
  description?: string;
  memberIds?: string[];
  status?: ProjectStatus;
};

export type CreateBoardInput = {
  name: string;
  description?: string;
};

export type CreateColumnInput = {
  key: ProjectColumnKey;
  name: string;
  order?: number;
};

export type UpdateColumnInput = {
  name?: string;
  order?: number;
};

export type CreateLabelInput = {
  name: string;
  color?: string;
};

export type Board = {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type ProjectColumn = {
  id: string;
  boardId: string;
  key: ProjectColumnKey;
  name: string;
  order: number;
  createdAt?: string;
  updatedAt?: string;
};
