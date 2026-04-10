'use client';

import { useQuery } from '@tanstack/react-query';
import { aiAgentApi } from '../api/ai-agent.api';
import type { TaskReportHistoryQuery } from '@/shared/types/api/ai-agent';

export function useTaskReportHistory(
  taskId: string,
  options?: { enabled?: boolean; query?: TaskReportHistoryQuery },
) {
  return useQuery({
    queryKey: [
      'ai-agent',
      'task-report-history',
      taskId,
      options?.query?.page ?? 1,
      options?.query?.pageSize ?? 20,
      options?.query?.verdict ?? 'all',
      options?.query?.minScore ?? 'none',
      options?.query?.maxScore ?? 'none',
    ],
    enabled: Boolean(taskId) && (options?.enabled ?? true),
    queryFn: () => aiAgentApi.getTaskReportHistory(taskId, options?.query),
    staleTime: 20_000,
  });
}
