import type * as React from 'react';
import type {
  AnalyzeTaskReportResult,
  AssignmentAdviceResult,
  ProjectReportSummaryResult,
  TaskReportHistoryResult,
  TaskReportHistoryVerdict,
} from '@/shared/types/api/ai-agent';
import type { Project } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';

export type TaskItem = {
  task: Task;
  projectId: string;
  projectName: string;
};

export type AiAgentChatMessage = {
  id: string;
  role: 'assistant' | 'user';
  text: string;
};

export type AiAgentChatPanelProps = {
  chatMessages: AiAgentChatMessage[];
  chatInput: string;
  onChatInputChange: (value: string) => void;
  onSend: () => void;
  sendDisabled?: boolean;
  chatViewportRef: React.RefObject<HTMLDivElement | null>;
};

export type AiAgentReportHistorySectionProps = {
  taskHistoryResult?: TaskReportHistoryResult | null;
  taskHistoryIsFetching: boolean;
  taskHistoryIsError: boolean;
  taskHistoryErrorMessage?: string;
  historyVerdict: 'all' | TaskReportHistoryVerdict;
  onHistoryVerdictChange: (value: 'all' | TaskReportHistoryVerdict) => void;
  historyMinScore: string;
  onHistoryMinScoreChange: (value: string) => void;
  historyMaxScore: string;
  onHistoryMaxScoreChange: (value: string) => void;
  historyPageSize: number;
  onHistoryPageSizeChange: (value: number) => void;
  onHistoryReset: () => void;
  onHistoryPrev: () => void;
  onHistoryNext: () => void;
  formatDateTime: (value?: string | null) => string;
};

export type AiAgentReviewSectionProps = {
  reportTaskId: string;
  onReportTaskChange: (value: string) => void;
  taskOptions: TaskItem[];
  reportText: string;
  onReportTextChange: (value: string) => void;
  progressPercent: string;
  onProgressChange: (value: string) => void;
  workedHours: string;
  onWorkedHoursChange: (value: string) => void;
  blockers: string;
  onBlockersChange: (value: string) => void;
  nextActions: string;
  onNextActionsChange: (value: string) => void;
  onSubmitReport: () => void;
  submitReportPending: boolean;
  submitReportResult?: AnalyzeTaskReportResult | null;
  taskHistoryResult?: TaskReportHistoryResult | null;
  taskHistoryIsFetching: boolean;
  taskHistoryIsError: boolean;
  taskHistoryErrorMessage?: string;
  historyVerdict: 'all' | TaskReportHistoryVerdict;
  onHistoryVerdictChange: (value: 'all' | TaskReportHistoryVerdict) => void;
  historyMinScore: string;
  onHistoryMinScoreChange: (value: string) => void;
  historyMaxScore: string;
  onHistoryMaxScoreChange: (value: string) => void;
  historyPageSize: number;
  onHistoryPageSizeChange: (value: number) => void;
  onHistoryReset: () => void;
  onHistoryPrev: () => void;
  onHistoryNext: () => void;
  formatDateTime: (value?: string | null) => string;
};

export type AiAgentAdviceSectionProps = {
  currentAdviceProjectId: string;
  projects: Project[];
  onAdviceProjectChange: (value: string) => void;
  onRunSummary: () => void;
  summaryPending: boolean;
  summaryResult?: ProjectReportSummaryResult | null;
  adviceTaskTitle: string;
  onAdviceTaskTitleChange: (value: string) => void;
  adviceEstimatedHours: string;
  onAdviceEstimatedHoursChange: (value: string) => void;
  adviceDesiredDueDate: string;
  onAdviceDesiredDueDateChange: (value: string) => void;
  adviceRequiredSkills: string;
  onAdviceRequiredSkillsChange: (value: string) => void;
  onRunAssignmentAdvice: () => void;
  assignmentAdvicePending: boolean;
  assignmentAdviceResult?: AssignmentAdviceResult | null;
  toLocalDatetimeInput: (value?: string) => string;
};

export type AiAgentAutoPanelProps = {
  activeTab: 'review' | 'advice';
  onChangeTab: (tab: 'review' | 'advice') => void;
  reportTaskId: string;
  onReportTaskChange: (value: string) => void;
  taskOptions: TaskItem[];
  reportText: string;
  onReportTextChange: (value: string) => void;
  progressPercent: string;
  onProgressChange: (value: string) => void;
  workedHours: string;
  onWorkedHoursChange: (value: string) => void;
  blockers: string;
  onBlockersChange: (value: string) => void;
  nextActions: string;
  onNextActionsChange: (value: string) => void;
  onSubmitReport: () => void;
  submitReportPending: boolean;
  submitReportResult?: AnalyzeTaskReportResult | null;
  taskHistoryResult?: TaskReportHistoryResult | null;
  taskHistoryIsFetching: boolean;
  taskHistoryIsError: boolean;
  taskHistoryErrorMessage?: string;
  historyVerdict: 'all' | TaskReportHistoryVerdict;
  onHistoryVerdictChange: (value: 'all' | TaskReportHistoryVerdict) => void;
  historyMinScore: string;
  onHistoryMinScoreChange: (value: string) => void;
  historyMaxScore: string;
  onHistoryMaxScoreChange: (value: string) => void;
  historyPageSize: number;
  onHistoryPageSizeChange: (value: number) => void;
  onHistoryReset: () => void;
  onHistoryPrev: () => void;
  onHistoryNext: () => void;
  currentAdviceProjectId: string;
  projects: Project[];
  onAdviceProjectChange: (value: string) => void;
  onRunSummary: () => void;
  summaryPending: boolean;
  summaryResult?: ProjectReportSummaryResult | null;
  adviceTaskTitle: string;
  onAdviceTaskTitleChange: (value: string) => void;
  adviceEstimatedHours: string;
  onAdviceEstimatedHoursChange: (value: string) => void;
  adviceDesiredDueDate: string;
  onAdviceDesiredDueDateChange: (value: string) => void;
  adviceRequiredSkills: string;
  onAdviceRequiredSkillsChange: (value: string) => void;
  onRunAssignmentAdvice: () => void;
  assignmentAdvicePending: boolean;
  assignmentAdviceResult?: AssignmentAdviceResult | null;
  formatDateTime: (value?: string | null) => string;
  toLocalDatetimeInput: (value?: string) => string;
};
