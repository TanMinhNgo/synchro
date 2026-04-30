'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  useAiProjectReportSummary,
  useAssignmentAdvice,
  useSubmitTaskReport,
  useTaskReportHistory,
} from '@/features/ai-agent';
import { useProjectMembers } from '@/features/project/hooks/use-project-members';
import { useMyTasksKanban } from '@/features/task/hooks/useMyTasksKanban';
import type { TaskReportHistoryVerdict } from '@/shared/types/api/ai-agent';
import type { Task } from '@/shared/types/api/task';
import { AiAgentAutoPanel } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/AiAgentAutoPanel';
import type { TaskItem } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

function getReviewDisplay(result: unknown) {
  const payload = result as {
    verdict?: string;
    score?: number;
    analysis?: { verdict?: string; score?: number };
  };

  const verdict = payload.verdict ?? payload.analysis?.verdict ?? 'reviewed';
  const score =
    typeof payload.score === 'number'
      ? payload.score
      : typeof payload.analysis?.score === 'number'
        ? payload.analysis.score
        : null;

  return {
    verdict,
    scoreText: score === null ? 'N/A' : `${score}/100`,
  };
}

function toLocalDatetimeInput(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const tzOffset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
}

function formatDateTime(value?: string | null) {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleString();
}

function buildPrefilledReport(task: Task) {
  const doneSubtasks = (task.subtasks ?? []).filter((s) => s.isDone);
  const pendingSubtasks = (task.subtasks ?? []).filter((s) => !s.isDone);
  const progress =
    task.subtasks && task.subtasks.length > 0
      ? Math.round((doneSubtasks.length / task.subtasks.length) * 100)
      : null;

  const reportParts: string[] = [
    `Task: ${task.title}`,
    `Description: ${task.description?.trim() || 'No description provided.'}`,
    `Completed subtasks: ${
      doneSubtasks.length > 0
        ? doneSubtasks.map((s) => s.title).join('; ')
        : 'None reported'
    }`,
    `Pending subtasks: ${
      pendingSubtasks.length > 0
        ? pendingSubtasks.map((s) => s.title).join('; ')
        : 'None'
    }`,
    `Due date: ${task.dueDate ? new Date(task.dueDate).toLocaleString() : 'Not set'}`,
    'Impact/Outcome: ',
    'Blockers: ',
    'Next actions: ',
  ];

  return {
    reportText: reportParts.join('\n'),
    progressPercent: progress,
    nextActions:
      pendingSubtasks.length > 0
        ? `Continue: ${pendingSubtasks.map((s) => s.title).join('; ')}`
        : '',
  };
}

export default function AiAgentAutoPage() {
  const { items, projectsQuery } = useMyTasksKanban();
  const projects = React.useMemo(
    () => projectsQuery.data ?? [],
    [projectsQuery.data],
  );

  const taskOptions = React.useMemo<TaskItem[]>(
    () => [...items].sort((a, b) => a.task.title.localeCompare(b.task.title)),
    [items],
  );

  const [activeTab, setActiveTab] = React.useState<'review' | 'advice'>('review');
  const [reportTaskId, setReportTaskId] = React.useState<string>('');
  const [reportText, setReportText] = React.useState('');
  const [progressPercent, setProgressPercent] = React.useState('');
  const [workedHours, setWorkedHours] = React.useState('');
  const [blockers, setBlockers] = React.useState('');
  const [nextActions, setNextActions] = React.useState('');

  const [adviceProjectId, setAdviceProjectId] = React.useState<string>('');
  const [adviceTaskTitle, setAdviceTaskTitle] = React.useState('');
  const [adviceEstimatedHours, setAdviceEstimatedHours] = React.useState('8');
  const [adviceRequiredSkills, setAdviceRequiredSkills] = React.useState('');
  const [adviceDesiredDueDate, setAdviceDesiredDueDate] = React.useState('');

  const [historyPage, setHistoryPage] = React.useState(1);
  const [historyPageSize, setHistoryPageSize] = React.useState(10);
  const [historyVerdict, setHistoryVerdict] = React.useState<
    'all' | TaskReportHistoryVerdict
  >('all');
  const [historyMinScore, setHistoryMinScore] = React.useState('');
  const [historyMaxScore, setHistoryMaxScore] = React.useState('');
  const [debouncedHistoryMinScore, setDebouncedHistoryMinScore] =
    React.useState('');
  const [debouncedHistoryMaxScore, setDebouncedHistoryMaxScore] =
    React.useState('');

  const summaryMutation = useAiProjectReportSummary();
  const submitReportMutation = useSubmitTaskReport();
  const assignmentAdviceMutation = useAssignmentAdvice();

  React.useEffect(() => {
    if (!reportTaskId && taskOptions.length > 0) {
      setReportTaskId(taskOptions[0].task.id);
    }
  }, [taskOptions, reportTaskId]);

  React.useEffect(() => {
    if (!adviceProjectId && projects.length > 0) {
      setAdviceProjectId(projects[0].id);
    }
  }, [adviceProjectId, projects]);

  const reportTask = React.useMemo(
    () => taskOptions.find((x) => x.task.id === reportTaskId) ?? null,
    [taskOptions, reportTaskId],
  );

  const membersQuery = useProjectMembers(adviceProjectId, {
    enabled: Boolean(adviceProjectId),
    staleTime: 15_000,
  });

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedHistoryMinScore(historyMinScore);
      setDebouncedHistoryMaxScore(historyMaxScore);
    }, 400);

    return () => clearTimeout(timer);
  }, [historyMinScore, historyMaxScore]);

  const parsedMinScore =
    debouncedHistoryMinScore.trim() === ''
      ? undefined
      : Number(debouncedHistoryMinScore);
  const parsedMaxScore =
    debouncedHistoryMaxScore.trim() === ''
      ? undefined
      : Number(debouncedHistoryMaxScore);

  const taskHistoryQuery = useTaskReportHistory(reportTaskId, {
    enabled: Boolean(reportTaskId),
    query: {
      page: historyPage,
      pageSize: historyPageSize,
      ...(historyVerdict !== 'all' ? { verdict: historyVerdict } : {}),
      ...(Number.isFinite(parsedMinScore) ? { minScore: parsedMinScore } : {}),
      ...(Number.isFinite(parsedMaxScore) ? { maxScore: parsedMaxScore } : {}),
    },
  });

  const prefillingTaskIdRef = React.useRef<string>('');

  React.useEffect(() => {
    if (!reportTask?.task) return;
    if (prefillingTaskIdRef.current === reportTask.task.id) return;

    prefillingTaskIdRef.current = reportTask.task.id;
    const prefilled = buildPrefilledReport(reportTask.task);
    setReportText(prefilled.reportText);
    setProgressPercent(
      typeof prefilled.progressPercent === 'number'
        ? String(prefilled.progressPercent)
        : '',
    );
    setWorkedHours('');
    setBlockers('');
    setNextActions(prefilled.nextActions);
  }, [reportTask]);

  React.useEffect(() => {
    setHistoryPage(1);
  }, [
    reportTaskId,
    historyVerdict,
    debouncedHistoryMinScore,
    debouncedHistoryMaxScore,
    historyPageSize,
  ]);

  const runSummary = React.useCallback(() => {
    if (!adviceProjectId) {
      toast.error('Please select a project first.');
      return;
    }

    summaryMutation.mutate(
      { projectId: adviceProjectId },
      {
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to get summary');
        },
      },
    );
  }, [adviceProjectId, summaryMutation]);

  const runReportReview = React.useCallback(() => {
    if (!reportTask || reportText.trim().length < 20) {
      toast.error('Please select a task and add at least 20 characters.');
      return;
    }

    submitReportMutation.mutate(
      {
        taskId: reportTask.task.id,
        input: {
          reportText: reportText.trim(),
          ...(progressPercent !== ''
            ? { progressPercent: Number(progressPercent) }
            : {}),
          ...(workedHours !== '' ? { workedHours: Number(workedHours) } : {}),
          ...(blockers.trim() ? { blockers: blockers.trim() } : {}),
          ...(nextActions.trim() ? { nextActions: nextActions.trim() } : {}),
          submittedAt: new Date().toISOString(),
          notifyInInbox: true,
        },
      },
      {
        onSuccess: (res) => {
          const display = getReviewDisplay(res);
          toast.success(`AI reviewed report: ${display.verdict} (${display.scoreText})`);
          taskHistoryQuery.refetch();
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to submit report');
        },
      },
    );
  }, [
    blockers,
    nextActions,
    progressPercent,
    reportTask,
    reportText,
    submitReportMutation,
    taskHistoryQuery,
    workedHours,
  ]);

  const runAssignmentAdvice = React.useCallback(() => {
    if (!adviceProjectId || !adviceTaskTitle.trim() || Number(adviceEstimatedHours) < 1) {
      toast.error('Please select project, task title, and estimated hours.');
      return;
    }

    const candidates = (membersQuery.data ?? []).map((member) => ({
      userId: member.id,
      displayName: member.name,
      skillTags: [],
    }));

    assignmentAdviceMutation.mutate(
      {
        projectId: adviceProjectId,
        input: {
          taskTitle: adviceTaskTitle.trim(),
          estimatedHours: Number(adviceEstimatedHours),
          requiredSkills: adviceRequiredSkills
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean),
          ...(adviceDesiredDueDate
            ? {
                desiredDueDate: new Date(adviceDesiredDueDate).toISOString(),
              }
            : {}),
          candidates,
        },
      },
      {
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to generate assignment advice');
        },
      },
    );
  }, [
    adviceDesiredDueDate,
    adviceEstimatedHours,
    adviceRequiredSkills,
    adviceTaskTitle,
    adviceProjectId,
    assignmentAdviceMutation,
    membersQuery.data,
  ]);

  return (
    <div className="flex min-h-screen flex-col gap-4 bg-white p-4 text-black">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">AI Auto Tools</h1>
          <p className="text-sm text-zinc-600">
            Review reports, browse history, and get project summaries or assignee advice.
          </p>
        </div>
        <Link href="/tasks">
          <Button variant="outline" className="border-zinc-300 text-black hover:bg-zinc-100">
            <ArrowLeft className="mr-2 size-4" />
            Back to Tasks
          </Button>
        </Link>
      </div>

      <div className="flex-1">
        <AiAgentAutoPanel
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          reportTaskId={reportTaskId}
          onReportTaskChange={setReportTaskId}
          taskOptions={taskOptions}
          reportText={reportText}
          onReportTextChange={setReportText}
          progressPercent={progressPercent}
          onProgressChange={setProgressPercent}
          workedHours={workedHours}
          onWorkedHoursChange={setWorkedHours}
          blockers={blockers}
          onBlockersChange={setBlockers}
          nextActions={nextActions}
          onNextActionsChange={setNextActions}
          onSubmitReport={runReportReview}
          submitReportPending={submitReportMutation.isPending}
          submitReportResult={submitReportMutation.data}
          taskHistoryResult={taskHistoryQuery.data}
          taskHistoryIsFetching={taskHistoryQuery.isFetching}
          taskHistoryIsError={taskHistoryQuery.isError}
          taskHistoryErrorMessage={(taskHistoryQuery.error as Error)?.message}
          historyVerdict={historyVerdict}
          onHistoryVerdictChange={(value) =>
            setHistoryVerdict(value as 'all' | TaskReportHistoryVerdict)
          }
          historyMinScore={historyMinScore}
          onHistoryMinScoreChange={setHistoryMinScore}
          historyMaxScore={historyMaxScore}
          onHistoryMaxScoreChange={setHistoryMaxScore}
          historyPageSize={historyPageSize}
          onHistoryPageSizeChange={setHistoryPageSize}
          onHistoryReset={() => {
            setHistoryVerdict('all');
            setHistoryMinScore('');
            setHistoryMaxScore('');
            setDebouncedHistoryMinScore('');
            setDebouncedHistoryMaxScore('');
          }}
          onHistoryPrev={() => setHistoryPage((p) => Math.max(1, p - 1))}
          onHistoryNext={() =>
            setHistoryPage((p) =>
              Math.min(taskHistoryQuery.data?.pagination.totalPages ?? p, p + 1),
            )
          }
          currentAdviceProjectId={adviceProjectId}
          projects={projects}
          onAdviceProjectChange={setAdviceProjectId}
          onRunSummary={runSummary}
          summaryPending={summaryMutation.isPending}
          summaryResult={summaryMutation.data}
          adviceTaskTitle={adviceTaskTitle}
          onAdviceTaskTitleChange={setAdviceTaskTitle}
          adviceEstimatedHours={adviceEstimatedHours}
          onAdviceEstimatedHoursChange={setAdviceEstimatedHours}
          adviceDesiredDueDate={adviceDesiredDueDate}
          onAdviceDesiredDueDateChange={setAdviceDesiredDueDate}
          adviceRequiredSkills={adviceRequiredSkills}
          onAdviceRequiredSkillsChange={setAdviceRequiredSkills}
          onRunAssignmentAdvice={runAssignmentAdvice}
          assignmentAdvicePending={assignmentAdviceMutation.isPending}
          assignmentAdviceResult={assignmentAdviceMutation.data}
          formatDateTime={formatDateTime}
          toLocalDatetimeInput={toLocalDatetimeInput}
        />
      </div>
    </div>
  );
}
