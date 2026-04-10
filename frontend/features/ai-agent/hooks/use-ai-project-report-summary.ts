'use client';

import { useMutation } from '@tanstack/react-query';
import { aiAgentApi } from '../api/ai-agent.api';

export function useAiProjectReportSummary() {
  return useMutation({
    mutationFn: async (args: { projectId: string }) =>
      aiAgentApi.getProjectReportSummary(args.projectId),
  });
}
