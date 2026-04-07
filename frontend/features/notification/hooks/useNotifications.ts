'use client';

import { useQuery } from '@tanstack/react-query';
import { notificationApi } from '../api/notification.api';

export function useNotifications(params?: { unreadOnly?: boolean }) {
  return useQuery({
    queryKey: ['notifications', params?.unreadOnly ? 'unread' : 'all'],
    queryFn: () => notificationApi.list(params),
  });
}
