'use client';

import { useMutation } from '@tanstack/react-query';
import { aiAgentApi } from '../api/ai-agent.api';
import type { AnalyzeTaskReportInput } from '@/shared/types/api/ai-agent';

export function useSubmitTaskReport() {
  return useMutation({
    mutationFn: async (args: {
      taskId: string;
      input: AnalyzeTaskReportInput;
    }) => aiAgentApi.submitTaskReport(args.taskId, args.input),
  });
}
