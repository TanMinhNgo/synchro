import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../model/auth.store';
import { RegisterAction } from '@/shared/types/user';

export const useRegister = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: RegisterAction) => {
      const response = await authApi.register(data);
      localStorage.setItem('access_token', response.accessToken);
      // Fetch user profile right after registration
      const user = await authApi.getCurrentUser();
      return { user, accessToken: response.accessToken };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
};
