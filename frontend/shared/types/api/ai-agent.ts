export type AiReviewSeverity = 'high' | 'medium' | 'low';

export type AiReviewIssue = {
  code: string;
  severity: AiReviewSeverity;
  message: string;
};

export type AssistantChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type AssistantChatRequest = {
  messages: AssistantChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type AssistantChatResponse = {
  userId: string;
  reply: string;
  provider: 'openai' | 'azure-openai' | 'unknown';
  model: string;
  generatedAt: string;
};

export type AnalyzeTaskReportInput = {
  reportText: string;
  progressPercent?: number;
  workedHours?: number;
  blockers?: string;
  nextActions?: string;
  submittedAt?: string;
  notifyInInbox?: boolean;
};

export type AnalyzeTaskReportResult = {
  task: {
    id: string;
    title: string;
  };
  verdict: 'needs_fix' | 'review_manually' | 'reasonable';
  score: number;
  claimedProgressPercent: number | null;
  subtaskProgressPercent: number | null;
  issues: AiReviewIssue[];
  recommendations: string[];
  analysisSource: 'llm+rules' | 'rules-only';
  llmSummary: string | null;
  notifiedUserIds: string[];
};

export type TaskReportHistoryItem = {
  id: string;
  actorUserId: string;
  reportText: string;
  progressPercent: number | null;
  workedHours: number | null;
  blockers: string | null;
  nextActions: string | null;
  verdict: 'needs_fix' | 'review_manually' | 'reasonable';
  score: number;
  analysisSource: 'llm+rules' | 'rules-only';
  llmSummary: string | null;
  issues: AiReviewIssue[];
  recommendations: string[];
  submittedAt: string | null;
  createdAt: string | null;
};

export type TaskReportHistoryVerdict =
  | 'needs_fix'
  | 'review_manually'
  | 'reasonable';

export type TaskReportHistoryQuery = {
  page?: number;
  pageSize?: number;
  verdict?: TaskReportHistoryVerdict;
  minScore?: number;
  maxScore?: number;
};

export type TaskReportHistoryResult = {
  task: {
    id: string;
    title: string;
  };
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
  appliedFilters: {
    verdict: TaskReportHistoryVerdict | null;
    minScore: number | null;
    maxScore: number | null;
  };
  items: TaskReportHistoryItem[];
};

export type ProjectReportSummaryResult = {
  projectId: string;
  summary: {
    totalTasks: number;
    doneTasks: number;
    inProgressTasks: number;
    overdueTasks: number;
    completionRatePercent: number;
  };
  assigneeStats: Array<{
    assigneeId: string;
    total: number;
    overdue: number;
    done: number;
  }>;
  riskyTasks: Array<{
    id?: string;
    title: string;
    reasons: string[];
    dueDate: string | null;
    assigneeIds: string[];
  }>;
  insights: string[];
  generatedAt: string;
};

export type AssignmentAdviceInput = {
  taskTitle: string;
  taskDescription?: string;
  estimatedHours: number;
  requiredSkills?: string[];
  desiredDueDate?: string;
  candidates: Array<{
    userId: string;
    displayName?: string;
    skillTags?: string[];
    currentLoadHours?: number;
    availableHoursPerWeek?: number;
  }>;
};

export type AssignmentAdviceResult = {
  projectId: string;
  taskDraft: {
    title: string;
    estimatedHours: number;
  };
  recommendation: {
    userId: string;
    displayName: string;
    score: number;
    rationale: string[];
    projectedWeeklyLoadHours: number;
  } | null;
  alternatives: Array<{
    userId: string;
    displayName: string;
    score: number;
    rationale: string[];
    projectedWeeklyLoadHours: number;
  }>;
  schedule: {
    suggestedStartDate: string;
    suggestedDueDate: string;
    suggestedFocusHoursPerDay: number;
    warning: string | null;
  };
  generatedAt: string;
};
