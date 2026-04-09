export const userServiceSubjects = {
  findById: 'users.findById',
  findByEmail: 'users.findByEmail',
  findByGoogleId: 'users.findByGoogleId',
  createLocalUser: 'users.createLocalUser',
  createGoogleUser: 'users.createGoogleUser',
  updateProfile: 'users.updateProfile',
} as const;

export type RemoteUser = {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  passwordHash?: string;
  providers?: {
    google?: { id: string };
  };
};

export type FindByIdReq = { userId: string };
export type FindByEmailReq = { email: string };
export type FindByGoogleIdReq = { googleId: string };
export type CreateLocalUserReq = {
  email: string;
  name: string;
  passwordHash: string;
};
export type CreateGoogleUserReq = {
  email: string;
  name: string;
  googleId: string;
  avatarUrl?: string;
};

export type UpdateProfileReq = {
  userId: string;
  name?: string;
  avatarUrl?: string;
};

export type FindUserRes = { user: RemoteUser | null };
export type CreateUserRes = { user: RemoteUser };
export type UpdateUserRes = { user: RemoteUser | null };
