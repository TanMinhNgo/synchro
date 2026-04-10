'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, type UpdateProfileInput } from '../api/auth.api';
import { useAuthStore } from '../model/auth.store';

export function useUpdateProfile() {
  const setAuth = useAuthStore((state) => state.setAuth);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateProfileInput) =>
      authApi.updateProfile(input),
    onSuccess: (user) => {
      const token = localStorage.getItem('access_token') ?? '';
      if (token) {
        setAuth(user, token);
      }
      queryClient.setQueryData(['currentUser'], user);
    },
  });
}
