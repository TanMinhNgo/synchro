'use client';

import { useMutation } from '@tanstack/react-query';
import { aiAgentApi } from '../api/ai-agent.api';
import type { AssignmentAdviceInput } from '@/shared/types/api/ai-agent';

export function useAssignmentAdvice() {
  return useMutation({
    mutationFn: async (args: {
      projectId: string;
      input: AssignmentAdviceInput;
    }) => aiAgentApi.getAssignmentAdvice(args.projectId, args.input),
  });
}
