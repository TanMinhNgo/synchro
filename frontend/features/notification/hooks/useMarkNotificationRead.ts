'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { notificationId: string; read?: boolean }) =>
      notificationApi.markRead(params.notificationId, { read: params.read }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
