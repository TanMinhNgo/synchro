import { apiClient } from '@/shared/api/client';
import { LoginAction, RegisterAction, User } from '@/shared/types/user';

interface AuthResponse {
  accessToken: string;
}

export const authApi = {
  login: async (data: LoginAction): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterAction): Promise<AuthResponse> => {
    const response = await apiClient.post('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  }
};
