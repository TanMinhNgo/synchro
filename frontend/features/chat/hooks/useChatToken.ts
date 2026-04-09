'use client';

import { useQuery } from '@tanstack/react-query';
import { chatApi } from '../api/chat.api';

export function useChatToken(enabled: boolean) {
  return useQuery({
    queryKey: ['chat', 'token'],
    queryFn: () => chatApi.getToken(),
    enabled,
    staleTime: 60_000,
  });
}

export function useVideoToken(enabled: boolean, callId: string) {
  return useQuery({
    queryKey: ['chat', 'video-token', callId],
    queryFn: () => chatApi.getVideoToken(callId),
    enabled,
    staleTime: 60_000,
  });
}
