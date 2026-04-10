import { apiClient } from '@/shared/api/client';
import type {
  AnalyzeTaskReportInput,
  AnalyzeTaskReportResult,
  AssignmentAdviceInput,
  AssignmentAdviceResult,
  ProjectReportSummaryResult,
  TaskReportHistoryQuery,
  TaskReportHistoryResult,
} from '@/shared/types/api/ai-agent';

export const aiAgentApi = {
  async submitTaskReport(taskId: string, input: AnalyzeTaskReportInput) {
    const res = await apiClient.post(`/ai-agent/tasks/${taskId}/submit-report`, input);
    return res.data as AnalyzeTaskReportResult;
  },

  async analyzeTaskReport(taskId: string, input: AnalyzeTaskReportInput) {
    const res = await apiClient.post(`/ai-agent/tasks/${taskId}/analyze-report`, input);
    return res.data as AnalyzeTaskReportResult;
  },

  async getProjectReportSummary(projectId: string) {
    const res = await apiClient.get(`/ai-agent/projects/${projectId}/report-summary`);
    return res.data as ProjectReportSummaryResult;
  },

  async getTaskReportHistory(taskId: string, query?: TaskReportHistoryQuery) {
    const params = {
      ...(query?.page ? { page: query.page } : {}),
      ...(query?.pageSize ? { pageSize: query.pageSize } : {}),
      ...(query?.verdict ? { verdict: query.verdict } : {}),
      ...(typeof query?.minScore === 'number' ? { minScore: query.minScore } : {}),
      ...(typeof query?.maxScore === 'number' ? { maxScore: query.maxScore } : {}),
    };

    const res = await apiClient.get(`/ai-agent/tasks/${taskId}/report-history`, {
      params,
    });
    return res.data as TaskReportHistoryResult;
  },

  async getAssignmentAdvice(projectId: string, input: AssignmentAdviceInput) {
    const res = await apiClient.post(
      `/ai-agent/projects/${projectId}/assignment-advice`,
      input,
    );
    return res.data as AssignmentAdviceResult;
  },
};
