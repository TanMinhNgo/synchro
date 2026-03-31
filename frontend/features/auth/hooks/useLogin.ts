import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../model/auth.store';
import { LoginAction } from '@/shared/types/user';

export const useLogin = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: LoginAction) => {
      const response = await authApi.login(data);
      localStorage.setItem('access_token', response.accessToken);
      // Fetch user profile right after login since login API only returns token
      const user = await authApi.getCurrentUser();
      return { user, accessToken: response.accessToken };
    },
    onSuccess: (data) => {
      setAuth(data.user, data.accessToken);
      queryClient.setQueryData(['currentUser'], data.user);
    },
  });
};
