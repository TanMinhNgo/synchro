import { apiClient } from '@/shared/api/client';
import type { ChatTokenResponse, VideoTokenResponse } from '@/shared/types/api/chat';

export const chatApi = {
  async getToken(): Promise<ChatTokenResponse> {
    const res = await apiClient.get('/chat/token');
    return res.data as ChatTokenResponse;
  },

  async getVideoToken(callId: string): Promise<VideoTokenResponse> {
    const res = await apiClient.get('/chat/video-token', { params: { callId } });
    return res.data as VideoTokenResponse;
  },
};
