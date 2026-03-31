'use client';

import { useQuery } from '@tanstack/react-query';
import { authApi } from '../api/auth.api';
import { useAuthStore } from '../model/auth.store';
import { useEffect } from 'react';

export const useCurrentUser = () => {
  const setAuth = useAuthStore((state) => state.setAuth);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const query = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => authApi.getCurrentUser(),
    retry: false,
  });

  useEffect(() => {
    if (query.isSuccess && query.data) {
      const token = localStorage.getItem('access_token');
      if (token) {
        setAuth(query.data, token);
      }
    } else if (query.isError) {
      clearAuth();
    }
  }, [query.isSuccess, query.isError, query.data, setAuth, clearAuth]);

  return query;
};
