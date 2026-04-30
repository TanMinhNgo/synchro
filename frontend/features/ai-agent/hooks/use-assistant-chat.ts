import { useMutation } from '@tanstack/react-query';
import { aiAgentApi } from '../api/ai-agent.api';

export function useAssistantChat() {
  return useMutation({
    mutationFn: aiAgentApi.chatWithAssistant,
  });
}
