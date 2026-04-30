import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import type { Model } from 'mongoose';
import type { AnalyzeTaskReportDto } from '@/contracts/ai-agent/dto/analyze-task-report.dto';
import type { AssignmentAdviceDto } from '@/contracts/ai-agent/dto/assignment-advice.dto';
import type { AssistantChatDto } from '@/contracts/ai-agent/dto/assistant-chat.dto';
import { NotificationProxyService } from '@/modules/notification/notification.proxy.service';
import { ProjectServiceClient } from '@/modules/project/project-service.client';
import { TaskServiceClient } from '@/modules/task/task-service.client';
import {
  TaskReportHistory,
  type TaskReportHistoryDocument,
} from './schemas/task-report-history.schema';

type RiskSeverity = 'high' | 'medium' | 'low';

type ReviewIssue = {
  code: string;
  severity: RiskSeverity;
  message: string;
};

type ReviewVerdict = 'needs_fix' | 'review_manually' | 'reasonable';

type LlmReviewResult = {
  score?: number;
  verdict?: ReviewVerdict;
  issues?: ReviewIssue[];
  recommendations?: string[];
  summary?: string;
};

type ParsedTask = {
  id?: string;
  projectId: string;
  title: string;
  dueDate?: Date;
  columnKey?: string;
  priority?: string;
  createdBy?: string;
  assigneeIds: string[];
  subtasksTotal: number;
  subtasksDone: number;
};

type RankedCandidate = {
  userId: string;
  displayName: string;
  score: number;
  rationale: string[];
  projectedWeeklyLoadHours: number;
};

type HistoryFilterOptions = {
  page?: number;
  pageSize?: number;
  verdict?: ReviewVerdict;
  minScore?: number;
  maxScore?: number;
};

@Injectable()
export class AiAgentService {
  constructor(
    private readonly config: ConfigService,
    @InjectModel(TaskReportHistory.name)
    private readonly historyModel: Model<TaskReportHistoryDocument>,
    private readonly tasks: TaskServiceClient,
    private readonly projects: ProjectServiceClient,
    private readonly notifications: NotificationProxyService,
  ) {}

  async analyzeTaskReport(
    actorUserId: string,
    taskId: string,
    dto: AnalyzeTaskReportDto,
  ) {
    const res = await this.tasks.get(actorUserId, taskId);
    const task = this.parseTask(res.task);

    await this.projects.getProject(actorUserId, task.projectId);

    const now = dto.submittedAt ? new Date(dto.submittedAt) : new Date();
    const reportWordCount = this.countWords(dto.reportText);
    const taskProgressFromSubtasks =
      task.subtasksTotal > 0
        ? Math.round((task.subtasksDone / task.subtasksTotal) * 100)
        : undefined;

    const issues: ReviewIssue[] = [];

    if (reportWordCount < 25) {
      issues.push({
        code: 'REPORT_TOO_SHORT',
        severity: 'medium',
        message:
          'Report is too short. Add concrete outcomes, impact, and next steps.',
      });
    }

    if (
      dto.progressPercent !== undefined &&
      taskProgressFromSubtasks !== undefined
    ) {
      const delta = Math.abs(dto.progressPercent - taskProgressFromSubtasks);
      if (delta >= 30) {
        issues.push({
          code: 'PROGRESS_MISMATCH',
          severity: 'high',
          message:
            'Claimed progress differs significantly from subtask completion. Please reconcile report and checklist.',
        });
      }
    }

    if (
      task.columnKey === 'done' &&
      dto.progressPercent !== undefined &&
      dto.progressPercent < 100
    ) {
      issues.push({
        code: 'DONE_WITH_LOW_PROGRESS',
        severity: 'high',
        message: 'Task is marked done but reported progress is below 100%.',
      });
    }

    if (task.dueDate && task.dueDate.getTime() < now.getTime()) {
      const progress = dto.progressPercent ?? taskProgressFromSubtasks ?? 0;
      if (progress < 100) {
        issues.push({
          code: 'OVERDUE_NOT_DONE',
          severity: 'high',
          message: 'Task is overdue and still not complete.',
        });
      }
    }

    if ((dto.progressPercent ?? 0) < 50 && !dto.blockers?.trim()) {
      issues.push({
        code: 'MISSING_BLOCKER_INFO',
        severity: 'medium',
        message: 'Progress is low but blocker details are missing.',
      });
    }

    if ((dto.progressPercent ?? 0) > 0 && dto.workedHours === 0) {
      issues.push({
        code: 'INCONSISTENT_HOURS',
        severity: 'low',
        message:
          'Reported progress exists while worked hours is 0. Confirm time tracking.',
      });
    }

    const ruleScore = this.computeScore(issues);
    const ruleVerdict = this.getVerdict(ruleScore, issues);
    const ruleRecommendations = this.buildRecommendations(
      issues,
      dto,
      taskProgressFromSubtasks,
    );

    const llmReview = await this.tryLlmReview({
      task,
      dto,
      taskProgressFromSubtasks,
      baseline: {
        score: ruleScore,
        verdict: ruleVerdict,
        issues,
        recommendations: ruleRecommendations,
      },
    });

    const finalIssues = this.mergeIssues(issues, llmReview?.issues ?? []);
    const finalScore = this.mergeScore(ruleScore, llmReview?.score);
    const finalVerdict = this.mergeVerdict(ruleVerdict, llmReview?.verdict);
    const recommendations = this.mergeRecommendations(
      ruleRecommendations,
      llmReview?.recommendations,
    );

    const notifyInInbox = dto.notifyInInbox ?? true;
    const notifiedUserIds: string[] = [];

    if (notifyInInbox) {
      const recipients = this.collectRecipients(task, actorUserId);
      const title =
        finalVerdict === 'needs_fix'
          ? 'AI review: Task report needs updates'
          : 'AI review: Task report looks good';
      const message =
        finalVerdict === 'needs_fix'
          ? `Task "${task.title}" has ${finalIssues.length} issue(s). Score ${finalScore}/100.`
          : `Task "${task.title}" report is reasonable. Score ${finalScore}/100.`;

      const settled = await Promise.allSettled(
        recipients.map((recipientId) =>
          this.notifications.create(recipientId, {
            type: 'AI_TASK_REPORT_REVIEW',
            title,
            message,
            data: {
              taskId,
              verdict: finalVerdict,
              score: finalScore,
              issues: finalIssues,
              llmSummary: llmReview?.summary,
            },
          }),
        ),
      );

      settled.forEach((s, idx) => {
        if (s.status === 'fulfilled') notifiedUserIds.push(recipients[idx]);
      });
    }

    const result = {
      task: {
        id: task.id ?? taskId,
        title: task.title,
      },
      verdict: finalVerdict,
      score: finalScore,
      claimedProgressPercent: dto.progressPercent ?? null,
      subtaskProgressPercent: taskProgressFromSubtasks ?? null,
      issues: finalIssues,
      recommendations,
      analysisSource: llmReview ? 'llm+rules' : 'rules-only',
      llmSummary: llmReview?.summary ?? null,
      notifiedUserIds,
    };

    await this.historyModel.create({
      taskId,
      projectId: task.projectId,
      actorUserId,
      reportText: dto.reportText,
      ...(dto.progressPercent !== undefined
        ? { progressPercent: dto.progressPercent }
        : {}),
      ...(dto.workedHours !== undefined
        ? { workedHours: dto.workedHours }
        : {}),
      ...(dto.blockers ? { blockers: dto.blockers } : {}),
      ...(dto.nextActions ? { nextActions: dto.nextActions } : {}),
      verdict: result.verdict,
      score: result.score,
      issues: result.issues,
      recommendations: result.recommendations,
      analysisSource: result.analysisSource,
      ...(result.llmSummary ? { llmSummary: result.llmSummary } : {}),
      ...(dto.submittedAt ? { submittedAt: new Date(dto.submittedAt) } : {}),
    });

    return result;
  }

  async getTaskReportHistory(
    userId: string,
    taskId: string,
    options?: HistoryFilterOptions,
  ) {
    const taskRes = await this.tasks.get(userId, taskId);
    const task = this.parseTask(taskRes.task);
    await this.projects.getProject(userId, task.projectId);

    const page = Number.isFinite(options?.page)
      ? Math.max(1, Math.floor(options?.page as number))
      : 1;
    const pageSize = Number.isFinite(options?.pageSize)
      ? Math.max(1, Math.min(100, Math.floor(options?.pageSize as number)))
      : 20;

    const query: Record<string, unknown> = { taskId };

    if (options?.verdict) {
      query.verdict = options.verdict;
    }

    const hasMinScore = Number.isFinite(options?.minScore);
    const hasMaxScore = Number.isFinite(options?.maxScore);
    if (hasMinScore || hasMaxScore) {
      query.score = {
        ...(hasMinScore
          ? {
              $gte: Math.max(
                0,
                Math.min(100, Math.floor(options?.minScore as number)),
              ),
            }
          : {}),
        ...(hasMaxScore
          ? {
              $lte: Math.max(
                0,
                Math.min(100, Math.floor(options?.maxScore as number)),
              ),
            }
          : {}),
      };
    }

    const totalItems = await this.historyModel.countDocuments(query);
    const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
    const safePage = Math.min(page, totalPages);
    const skip = (safePage - 1) * pageSize;

    const rows = await this.historyModel
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    return {
      task: {
        id: taskId,
        title: task.title,
      },
      pagination: {
        page: safePage,
        pageSize,
        totalItems,
        totalPages,
      },
      appliedFilters: {
        verdict: options?.verdict ?? null,
        minScore: hasMinScore
          ? Math.max(0, Math.min(100, Math.floor(options?.minScore as number)))
          : null,
        maxScore: hasMaxScore
          ? Math.max(0, Math.min(100, Math.floor(options?.maxScore as number)))
          : null,
      },
      items: rows.map((row) => {
        const rowData = row as unknown as Record<string, unknown>;
        const createdAt = this.parseDate(rowData.createdAt);

        return {
          id: String(row._id),
          actorUserId: row.actorUserId,
          reportText: row.reportText,
          progressPercent: row.progressPercent ?? null,
          workedHours: row.workedHours ?? null,
          blockers: row.blockers ?? null,
          nextActions: row.nextActions ?? null,
          verdict: row.verdict,
          score: row.score,
          analysisSource: row.analysisSource,
          llmSummary: row.llmSummary ?? null,
          issues: row.issues ?? [],
          recommendations: row.recommendations ?? [],
          submittedAt: row.submittedAt ? row.submittedAt.toISOString() : null,
          createdAt: createdAt ? createdAt.toISOString() : null,
        };
      }),
    };
  }

  async getProjectReportSummary(userId: string, projectId: string) {
    await this.projects.getProject(userId, projectId);
    const taskRes = await this.tasks.listByProject(userId, projectId, {});
    const tasks = taskRes.tasks.map((t) => this.parseTask(t));

    const now = Date.now();
    const totalTasks = tasks.length;
    const doneTasks = tasks.filter((t) => t.columnKey === 'done').length;
    const overdueTasks = tasks.filter((t) => {
      if (!t.dueDate) return false;
      if (t.columnKey === 'done') return false;
      return t.dueDate.getTime() < now;
    }).length;

    const inProgressTasks = tasks.filter(
      (t) => t.columnKey === 'in_progress',
    ).length;

    const byAssignee = new Map<
      string,
      { total: number; overdue: number; done: number }
    >();
    tasks.forEach((t) => {
      const assignees =
        t.assigneeIds.length > 0 ? t.assigneeIds : ['unassigned'];
      assignees.forEach((assigneeId) => {
        const current = byAssignee.get(assigneeId) ?? {
          total: 0,
          overdue: 0,
          done: 0,
        };
        current.total += 1;
        if (t.columnKey === 'done') current.done += 1;
        if (t.dueDate && t.dueDate.getTime() < now && t.columnKey !== 'done')
          current.overdue += 1;
        byAssignee.set(assigneeId, current);
      });
    });

    const assigneeStats = Array.from(byAssignee.entries()).map(
      ([assigneeId, stat]) => ({
        assigneeId,
        ...stat,
      }),
    );

    const riskyTasks = tasks
      .filter((t) => t.columnKey !== 'done')
      .map((t) => {
        const reasons: string[] = [];
        if (t.dueDate && t.dueDate.getTime() < now) reasons.push('overdue');
        if (t.priority === 'urgent' || t.priority === 'high')
          reasons.push('high_priority');
        if (t.subtasksTotal > 0 && t.subtasksDone === 0)
          reasons.push('no_subtask_progress');
        return {
          id: t.id,
          title: t.title,
          reasons,
          dueDate: t.dueDate?.toISOString() ?? null,
          assigneeIds: t.assigneeIds,
        };
      })
      .filter((t) => t.reasons.length > 0)
      .slice(0, 10);

    return {
      projectId,
      summary: {
        totalTasks,
        doneTasks,
        inProgressTasks,
        overdueTasks,
        completionRatePercent:
          totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0,
      },
      assigneeStats,
      riskyTasks,
      insights: this.buildProjectInsights(
        totalTasks,
        doneTasks,
        overdueTasks,
        riskyTasks.length,
      ),
      generatedAt: new Date().toISOString(),
    };
  }

  async getAssignmentAdvice(
    userId: string,
    projectId: string,
    dto: AssignmentAdviceDto,
  ) {
    await this.projects.getProject(userId, projectId);

    const taskRes = await this.tasks.listByProject(userId, projectId, {});
    const tasks = taskRes.tasks.map((t) => this.parseTask(t));

    const ranked = dto.candidates
      .map((candidate) => {
        const activeTasks = tasks.filter(
          (t) =>
            t.columnKey !== 'done' && t.assigneeIds.includes(candidate.userId),
        ).length;

        const overdueTasks = tasks.filter(
          (t) =>
            t.columnKey !== 'done' &&
            t.assigneeIds.includes(candidate.userId) &&
            t.dueDate &&
            t.dueDate.getTime() < Date.now(),
        ).length;

        const capacity = candidate.availableHoursPerWeek ?? 40;
        const load = candidate.currentLoadHours ?? 0;
        const projectedLoad = load + dto.estimatedHours;

        const required = new Set(
          (dto.requiredSkills ?? []).map((s) => s.toLowerCase()),
        );
        const skills = new Set(
          (candidate.skillTags ?? []).map((s) => s.toLowerCase()),
        );
        const skillMatch =
          required.size === 0
            ? 0
            : Array.from(required).filter((s) => skills.has(s)).length;

        let score = 100;
        score -= activeTasks * 6;
        score -= overdueTasks * 10;
        score -= Math.max(0, projectedLoad - capacity) * 2;
        score += skillMatch * 8;

        const rationale: string[] = [];
        rationale.push(`active_tasks=${activeTasks}`);
        rationale.push(`overdue_tasks=${overdueTasks}`);
        rationale.push(`projected_load=${projectedLoad}/${capacity}`);
        rationale.push(`skill_match=${skillMatch}/${required.size}`);

        return {
          userId: candidate.userId,
          displayName: candidate.displayName ?? candidate.userId,
          score,
          rationale,
          projectedWeeklyLoadHours: projectedLoad,
        } satisfies RankedCandidate;
      })
      .sort((a, b) => b.score - a.score);

    const recommended = ranked[0] ?? null;
    const alternatives = ranked.slice(1, 3);

    const schedule = this.suggestSchedule(
      dto.estimatedHours,
      dto.desiredDueDate,
    );

    return {
      projectId,
      taskDraft: {
        title: dto.taskTitle,
        estimatedHours: dto.estimatedHours,
      },
      recommendation: recommended,
      alternatives,
      schedule,
      generatedAt: new Date().toISOString(),
    };
  }

  async chatWithAssistant(userId: string, dto: AssistantChatDto) {
    if (!dto.messages || dto.messages.length === 0) {
      throw new BadRequestException('messages are required');
    }

    const systemPrompt =
      'You are Synchro AI assistant. Help with project planning, task breakdowns, progress summaries, and next-step advice. Be concise and actionable.';

    const messages = [
      { role: 'system', content: systemPrompt },
      ...dto.messages.map((m) => ({ role: m.role, content: m.content })),
    ];

    const preferredProvider = (
      this.config.get<string>('AI_REVIEW_PROVIDER') ?? ''
    ).toLowerCase();

    let content: string | null;
    let modelUsed: string | undefined;
    let providerUsed: 'openai' | 'azure-openai' | null;

    if (preferredProvider === 'azure-openai') {
      content = await this.callAzureOpenAi(messages, dto);
      providerUsed = content ? 'azure-openai' : null;
    } else if (preferredProvider === 'openai') {
      content = await this.callOpenAi(messages, dto);
      providerUsed = content ? 'openai' : null;
    } else {
      content = (await this.callOpenAi(messages, dto)) ?? null;
      providerUsed = content ? 'openai' : null;
      if (!content) {
        content = await this.callAzureOpenAi(messages, dto);
        providerUsed = content ? 'azure-openai' : null;
      }
    }

    if (!content) {
      throw new BadRequestException('AI provider is not configured');
    }

    modelUsed =
      providerUsed === 'azure-openai'
        ? this.config.get<string>('AZURE_OPENAI_DEPLOYMENT')
        : this.config.get<string>('OPENAI_MODEL') ?? 'gpt-5.0-mini';

    return {
      userId,
      reply: content,
      provider: providerUsed ?? 'unknown',
      model: modelUsed,
      generatedAt: new Date().toISOString(),
    };
  }

  private computeScore(issues: ReviewIssue[]) {
    let score = 100;
    issues.forEach((issue) => {
      if (issue.severity === 'high') score -= 25;
      else if (issue.severity === 'medium') score -= 12;
      else score -= 6;
    });
    if (score < 0) return 0;
    return score;
  }

  private getVerdict(score: number, issues: ReviewIssue[]): ReviewVerdict {
    const hasHigh = issues.some((i) => i.severity === 'high');
    if (hasHigh || score < 70) return 'needs_fix';
    if (score < 85) return 'review_manually';
    return 'reasonable';
  }

  private mergeRecommendations(primary: string[], secondary?: string[]) {
    const merged = [...primary, ...(secondary ?? [])].filter(
      (x) => typeof x === 'string' && x.trim().length > 0,
    );
    return Array.from(new Set(merged));
  }

  private mergeIssues(primary: ReviewIssue[], secondary: ReviewIssue[]) {
    const map = new Map<string, ReviewIssue>();
    [...primary, ...secondary].forEach((issue) => {
      const key = `${issue.code}:${issue.message}`;
      const current = map.get(key);
      if (!current) {
        map.set(key, issue);
        return;
      }

      if (
        this.severityRank(issue.severity) > this.severityRank(current.severity)
      ) {
        map.set(key, issue);
      }
    });
    return Array.from(map.values());
  }

  private mergeScore(ruleScore: number, llmScore?: number) {
    if (typeof llmScore !== 'number' || Number.isNaN(llmScore))
      return ruleScore;
    const normalized = Math.max(0, Math.min(100, Math.round(llmScore)));
    return Math.min(ruleScore, normalized);
  }

  private mergeVerdict(
    ruleVerdict: ReviewVerdict,
    llmVerdict?: ReviewVerdict,
  ): ReviewVerdict {
    if (!llmVerdict) return ruleVerdict;
    return this.verdictRank(llmVerdict) > this.verdictRank(ruleVerdict)
      ? llmVerdict
      : ruleVerdict;
  }

  private verdictRank(verdict: ReviewVerdict) {
    if (verdict === 'needs_fix') return 3;
    if (verdict === 'review_manually') return 2;
    return 1;
  }

  private severityRank(severity: RiskSeverity) {
    if (severity === 'high') return 3;
    if (severity === 'medium') return 2;
    return 1;
  }

  private normalizeVerdict(value: unknown): ReviewVerdict | undefined {
    if (value === 'needs_fix') return 'needs_fix';
    if (value === 'review_manually') return 'review_manually';
    if (value === 'reasonable') return 'reasonable';
    return undefined;
  }

  private normalizeIssues(raw: unknown): ReviewIssue[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((item) => {
        if (!item || typeof item !== 'object') return null;
        const row = item as Record<string, unknown>;
        const code = this.pickString(row.code) ?? 'LLM_REVIEW_NOTE';
        const message = this.pickString(row.message);
        const severityRaw = this.pickString(row.severity);
        if (!message) return null;

        const severity: RiskSeverity =
          severityRaw === 'high' ||
          severityRaw === 'medium' ||
          severityRaw === 'low'
            ? severityRaw
            : 'medium';

        return { code, severity, message } satisfies ReviewIssue;
      })
      .filter((v): v is ReviewIssue => Boolean(v));
  }

  private normalizeRecommendations(raw: unknown): string[] {
    if (!Array.isArray(raw)) return [];
    return raw
      .map((x) => (typeof x === 'string' ? x.trim() : ''))
      .filter(Boolean);
  }

  private parseJsonObject(content: string): Record<string, unknown> | null {
    const direct = this.tryParseJson(content);
    if (direct) return direct;

    const fenced = content.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (fenced?.[1]) {
      return this.tryParseJson(fenced[1].trim());
    }
    return null;
  }

  private tryParseJson(content: string): Record<string, unknown> | null {
    try {
      const parsed = JSON.parse(content);
      if (parsed && typeof parsed === 'object') {
        return parsed as Record<string, unknown>;
      }
      return null;
    } catch {
      return null;
    }
  }

  private async tryLlmReview(params: {
    task: ParsedTask;
    dto: AnalyzeTaskReportDto;
    taskProgressFromSubtasks: number | undefined;
    baseline: {
      score: number;
      verdict: ReviewVerdict;
      issues: ReviewIssue[];
      recommendations: string[];
    };
  }): Promise<LlmReviewResult | null> {
    const provider = (
      this.config.get<string>('AI_REVIEW_PROVIDER') ?? 'none'
    ).toLowerCase();
    if (provider === 'none') return null;

    const messages = [
      {
        role: 'system',
        content:
          'You are a strict engineering project reviewer. Return only JSON with keys: verdict, score, issues, recommendations, summary. verdict must be one of needs_fix, review_manually, reasonable. issues is array of {code,severity,message} where severity is high|medium|low.',
      },
      {
        role: 'user',
        content: JSON.stringify({
          task: {
            id: params.task.id,
            title: params.task.title,
            priority: params.task.priority,
            dueDate: params.task.dueDate?.toISOString() ?? null,
            columnKey: params.task.columnKey,
            subtasksTotal: params.task.subtasksTotal,
            subtasksDone: params.task.subtasksDone,
            subtaskProgressPercent: params.taskProgressFromSubtasks ?? null,
          },
          report: params.dto,
          baseline: params.baseline,
        }),
      },
    ];

    let content: string | undefined;

    if (provider === 'openai') {
      const apiKey = this.config.get<string>('OPENAI_API_KEY');
      if (!apiKey) return null;

      const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-4o-mini';

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model,
            temperature: 0.1,
            response_format: { type: 'json_object' },
            messages,
          }),
        },
      );

      if (!response.ok) return null;
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      content = data.choices?.[0]?.message?.content;
    }

    if (provider === 'azure-openai') {
      const endpoint = this.config.get<string>('AZURE_OPENAI_ENDPOINT');
      const apiKey = this.config.get<string>('AZURE_OPENAI_API_KEY');
      const deployment = this.config.get<string>('AZURE_OPENAI_DEPLOYMENT');
      const apiVersion =
        this.config.get<string>('AZURE_OPENAI_API_VERSION') ?? '2024-10-21';

      if (!endpoint || !apiKey || !deployment) return null;

      const url = `${endpoint.replace(/\/+$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey,
        },
        body: JSON.stringify({
          temperature: 0.1,
          response_format: { type: 'json_object' },
          messages,
        }),
      });

      if (!response.ok) return null;
      const data = (await response.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      content = data.choices?.[0]?.message?.content;
    }

    if (!content) return null;

    const parsed = this.parseJsonObject(content);
    if (!parsed) return null;

    const scoreValue = Number(parsed.score);
    const score = Number.isFinite(scoreValue) ? scoreValue : undefined;

    return {
      score,
      verdict: this.normalizeVerdict(parsed.verdict),
      issues: this.normalizeIssues(parsed.issues),
      recommendations: this.normalizeRecommendations(parsed.recommendations),
      summary: this.pickString(parsed.summary),
    };
  }

  private async callOpenAi(
    messages: Array<{ role: string; content: string }>,
    dto: AssistantChatDto,
  ) {
    const apiKey = this.config.get<string>('OPENAI_API_KEY');
    if (!apiKey) return null;

    const model = this.config.get<string>('OPENAI_MODEL') ?? 'gpt-5.0-mini';

    const response = await fetch(
      'https://api.openai.com/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: dto.temperature ?? 0.4,
          max_tokens: dto.maxTokens ?? 512,
          messages,
        }),
      },
    );

    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  }

  private async callAzureOpenAi(
    messages: Array<{ role: string; content: string }>,
    dto: AssistantChatDto,
  ) {
    const endpoint = this.config.get<string>('AZURE_OPENAI_ENDPOINT');
    const apiKey = this.config.get<string>('AZURE_OPENAI_API_KEY');
    const deployment = this.config.get<string>('AZURE_OPENAI_DEPLOYMENT');
    const apiVersion =
      this.config.get<string>('AZURE_OPENAI_API_VERSION') ?? '2024-10-21';

    if (!endpoint || !apiKey || !deployment) return null;

    const url = `${endpoint.replace(/\/+$/, '')}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'api-key': apiKey,
      },
      body: JSON.stringify({
        temperature: dto.temperature ?? 0.4,
        max_tokens: dto.maxTokens ?? 512,
        messages,
      }),
    });

    if (!response.ok) return null;
    const data = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    return data.choices?.[0]?.message?.content ?? null;
  }

  private buildRecommendations(
    issues: ReviewIssue[],
    dto: AnalyzeTaskReportDto,
    subtaskProgressPercent: number | undefined,
  ) {
    const recs = issues.map((i) => {
      if (i.code === 'REPORT_TOO_SHORT') {
        return 'Add what was done, measurable output, and what remains.';
      }
      if (i.code === 'PROGRESS_MISMATCH') {
        return `Update either report progress or subtasks to align with actual status (subtasks=${subtaskProgressPercent ?? 'n/a'}%).`;
      }
      if (i.code === 'MISSING_BLOCKER_INFO') {
        return 'Add blockers and owner for each blocker so the lead can help quickly.';
      }
      if (i.code === 'OVERDUE_NOT_DONE') {
        return 'Provide revised completion date and mitigation plan for overdue work.';
      }
      return 'Revise the report for consistency and clarity.';
    });

    if (!dto.nextActions?.trim()) {
      recs.push('Add clear next actions for the next reporting cycle.');
    }

    return Array.from(new Set(recs));
  }

  private buildProjectInsights(
    totalTasks: number,
    doneTasks: number,
    overdueTasks: number,
    riskyTaskCount: number,
  ) {
    const insights: string[] = [];

    if (totalTasks === 0) {
      insights.push('No tasks found for this project yet.');
      return insights;
    }

    const completion = Math.round((doneTasks / totalTasks) * 100);
    insights.push(`Completion rate is ${completion}%.`);

    if (overdueTasks > 0) {
      insights.push(
        `${overdueTasks} task(s) are overdue and should be prioritized.`,
      );
    } else {
      insights.push('No overdue tasks detected.');
    }

    if (riskyTaskCount > 0) {
      insights.push(
        `${riskyTaskCount} risky task(s) detected (priority/progress/due-date).`,
      );
    }

    return insights;
  }

  private suggestSchedule(estimatedHours: number, desiredDueDate?: string) {
    const start = new Date();
    const focusHoursPerDay = 4;
    const neededDays = Math.max(
      1,
      Math.ceil(estimatedHours / focusHoursPerDay),
    );
    const recommendedDueDate = new Date(start);
    recommendedDueDate.setDate(start.getDate() + neededDays);

    const desired = desiredDueDate ? new Date(desiredDueDate) : null;
    const warning =
      desired && desired.getTime() < recommendedDueDate.getTime()
        ? 'Desired due date is earlier than recommended timeline based on effort.'
        : null;

    return {
      suggestedStartDate: start.toISOString(),
      suggestedDueDate: recommendedDueDate.toISOString(),
      suggestedFocusHoursPerDay: focusHoursPerDay,
      warning,
    };
  }

  private collectRecipients(task: ParsedTask, actorUserId: string) {
    const recipients = new Set<string>();
    task.assigneeIds.forEach((id) => {
      if (id) recipients.add(id);
    });
    if (task.createdBy) recipients.add(task.createdBy);
    recipients.add(actorUserId);
    return Array.from(recipients);
  }

  private parseTask(raw: unknown): ParsedTask {
    if (!raw || typeof raw !== 'object') {
      throw new Error('Invalid task payload');
    }

    const row = raw as Record<string, unknown>;

    const projectId = this.pickString(row.projectId);
    if (!projectId) throw new Error('Task payload missing projectId');

    const assigneeIdsRaw = Array.isArray(row.assigneeIds)
      ? row.assigneeIds.filter(
          (x): x is string => typeof x === 'string' && x.length > 0,
        )
      : [];
    const assigneeId = this.pickString(row.assigneeId);
    const assigneeIds =
      assigneeIdsRaw.length > 0
        ? assigneeIdsRaw
        : assigneeId
          ? [assigneeId]
          : [];

    const subtasks = Array.isArray(row.subtasks) ? row.subtasks : [];
    const subtasksDone = subtasks.filter((s) => {
      if (!s || typeof s !== 'object') return false;
      return Boolean((s as Record<string, unknown>).isDone);
    }).length;

    return {
      id: this.pickString(row.id) ?? this.normalizeAnyId(row._id),
      projectId,
      title: this.pickString(row.title) ?? 'Untitled task',
      dueDate: this.parseDate(row.dueDate),
      columnKey: this.pickString(row.columnKey),
      priority: this.pickString(row.priority),
      createdBy: this.pickString(row.createdBy),
      assigneeIds,
      subtasksTotal: subtasks.length,
      subtasksDone,
    };
  }

  private normalizeAnyId(value: unknown) {
    if (typeof value === 'string') return value;
    if (value && typeof value === 'object' && 'toString' in value) {
      const text = (value as { toString: () => string }).toString();
      return text || undefined;
    }
    return undefined;
  }

  private pickString(value: unknown) {
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
    return undefined;
  }

  private parseDate(value: unknown) {
    if (!value) return undefined;
    const dt = new Date(String(value));
    if (Number.isNaN(dt.getTime())) return undefined;
    return dt;
  }

  private countWords(text: string) {
    const normalized = text.trim();
    if (!normalized) return 0;
    return normalized.split(/\s+/).filter(Boolean).length;
  }
}
