import { apiClient } from '@/shared/api/client';
import { LoginAction, RegisterAction, User } from '@/shared/types/user';

interface AuthResponse {
  accessToken: string;
}

interface RefreshResponse {
  accessToken: string;
  refreshToken?: string;
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

  refresh: async (): Promise<RefreshResponse> => {
    const response = await apiClient.post('/auth/refresh', {});
    return response.data;
  },

  googleLoginUrl: (): string => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
    return `${base}/auth/google`;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me');
    return response.data.user;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  }
};
