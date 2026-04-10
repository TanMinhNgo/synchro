import type { AnalyzeTaskReportDto } from '@/contracts/ai-agent/dto/analyze-task-report.dto';

export const AI_TASK_REPORT_SUBMITTED_EVENT = 'ai.task-report.submitted';

export type TaskReportSubmittedEvent = {
  actorUserId: string;
  taskId: string;
  report: AnalyzeTaskReportDto;
};
