'use client';

import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io } from 'socket.io-client';

function getNotificationSocketUrl() {
  const rawApiUrl =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080/api';
  return rawApiUrl.replace(/\/+api\/?$/, '');
}

export function useNotificationRealtime(enabled = true) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const socket = io(`${getNotificationSocketUrl()}/notifications`, {
      transports: ['websocket'],
      auth: { token },
      withCredentials: true,
    });

    const refreshNotifications = () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    };

    socket.on('notification:new', refreshNotifications);
    socket.on('notification:updated', refreshNotifications);
    socket.on('notification:read_all', refreshNotifications);

    return () => {
      socket.off('notification:new', refreshNotifications);
      socket.off('notification:updated', refreshNotifications);
      socket.off('notification:read_all', refreshNotifications);
      socket.disconnect();
    };
  }, [enabled, queryClient]);
}
