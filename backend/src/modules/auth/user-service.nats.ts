export const USER_SERVICE_NATS_CLIENT = 'USER_SERVICE_NATS_CLIENT';

export const userServiceSubjects = {
  findById: 'users.findById',
  findByEmail: 'users.findByEmail',
  findByGoogleId: 'users.findByGoogleId',
  createLocalUser: 'users.createLocalUser',
  createGoogleUser: 'users.createGoogleUser',
  updateProfile: 'users.updateProfile',
} as const;
