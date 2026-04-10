'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  useAiProjectReportSummary,
  useAssignmentAdvice,
  useSubmitTaskReport,
  useTaskReportHistory,
} from '@/features/ai-agent';
import { useProjectMembers } from '@/features/project/hooks/use-project-members';
import type { TaskReportHistoryVerdict } from '@/shared/types/api/ai-agent';
import type { Project } from '@/shared/types/api/project';
import type { Task } from '@/shared/types/api/task';

type TaskItem = {
  task: Task;
  projectId: string;
  projectName: string;
};

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

export function AiAgentPanel({
  tasks,
  projects,
  selectedProjectId,
}: {
  tasks: TaskItem[];
  projects: Project[];
  selectedProjectId: string;
}) {
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
  const [historyVerdict, setHistoryVerdict] = React.useState<'all' | TaskReportHistoryVerdict>('all');
  const [historyMinScore, setHistoryMinScore] = React.useState('');
  const [historyMaxScore, setHistoryMaxScore] = React.useState('');
  const [debouncedHistoryMinScore, setDebouncedHistoryMinScore] = React.useState('');
  const [debouncedHistoryMaxScore, setDebouncedHistoryMaxScore] = React.useState('');

  const summaryMutation = useAiProjectReportSummary();
  const submitReportMutation = useSubmitTaskReport();
  const assignmentAdviceMutation = useAssignmentAdvice();

  React.useEffect(() => {
    if (selectedProjectId !== 'all') {
      setAdviceProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const currentAdviceProjectId = adviceProjectId || (selectedProjectId !== 'all' ? selectedProjectId : '');

  const taskOptions = React.useMemo(() => {
    const list = selectedProjectId === 'all'
      ? tasks
      : tasks.filter((x) => x.projectId === selectedProjectId);

    return [...list].sort((a, b) => a.task.title.localeCompare(b.task.title));
  }, [tasks, selectedProjectId]);

  React.useEffect(() => {
    if (!reportTaskId && taskOptions.length > 0) {
      setReportTaskId(taskOptions[0].task.id);
    }
  }, [taskOptions, reportTaskId]);

  const reportTask = React.useMemo(
    () => taskOptions.find((x) => x.task.id === reportTaskId) ?? null,
    [taskOptions, reportTaskId],
  );

  const membersQuery = useProjectMembers(currentAdviceProjectId, {
    enabled: Boolean(currentAdviceProjectId),
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
    debouncedHistoryMinScore.trim() === '' ? undefined : Number(debouncedHistoryMinScore);
  const parsedMaxScore =
    debouncedHistoryMaxScore.trim() === '' ? undefined : Number(debouncedHistoryMaxScore);

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

  return (
    <Card>
      <CardHeader>
        <CardTitle>AI Agent Assistant</CardTitle>
        <CardDescription>
          Submit assignee reports for auto-review, generate project summary, and get assignment advice.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Auto Review Task Report</h3>

            <div className="space-y-2">
              <Label>Task</Label>
              <Select value={reportTaskId} onValueChange={setReportTaskId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select task" />
                </SelectTrigger>
                <SelectContent>
                  {taskOptions.map((item) => (
                    <SelectItem key={item.task.id} value={item.task.id}>
                      {item.task.title} ({item.projectName})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Report text</Label>
              <Textarea
                value={reportText}
                onChange={(e) => setReportText(e.target.value)}
                rows={5}
                placeholder="Describe what was done, impact, blockers, and next actions"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Progress (%)</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  value={progressPercent}
                  onChange={(e) => setProgressPercent(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Worked hours</Label>
                <Input
                  type="number"
                  min={0}
                  value={workedHours}
                  onChange={(e) => setWorkedHours(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Blockers</Label>
              <Textarea
                value={blockers}
                onChange={(e) => setBlockers(e.target.value)}
                rows={2}
                placeholder="Optional blocker details"
              />
            </div>

            <div className="space-y-2">
              <Label>Next actions</Label>
              <Textarea
                value={nextActions}
                onChange={(e) => setNextActions(e.target.value)}
                rows={2}
                placeholder="Optional next actions"
              />
            </div>

            <Button
              disabled={
                submitReportMutation.isPending ||
                !reportTask ||
                reportText.trim().length < 20
              }
              onClick={() => {
                if (!reportTask) return;
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
                      ...(nextActions.trim()
                        ? { nextActions: nextActions.trim() }
                        : {}),
                      submittedAt: new Date().toISOString(),
                      notifyInInbox: true,
                    },
                  },
                  {
                    onSuccess: (res) => {
                      toast.success(
                        `AI reviewed report: ${res.verdict} (${res.score}/100)`,
                      );
                      taskHistoryQuery.refetch();
                    },
                    onError: (err) => {
                      toast.error((err as Error).message || 'Failed to submit report');
                    },
                  },
                );
              }}
            >
              {submitReportMutation.isPending ? 'Reviewing…' : 'Submit Report (Event-driven AI)'}
            </Button>

            {submitReportMutation.data && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{submitReportMutation.data.analysisSource}</Badge>
                  <Badge>
                    {submitReportMutation.data.verdict} - {submitReportMutation.data.score}/100
                  </Badge>
                </div>
                {submitReportMutation.data.llmSummary ? (
                  <p>{submitReportMutation.data.llmSummary}</p>
                ) : null}
                {submitReportMutation.data.issues.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {submitReportMutation.data.issues.slice(0, 4).map((issue) => (
                      <li key={`${issue.code}-${issue.message}`}>
                        [{issue.severity}] {issue.message}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No major issues detected.</p>
                )}
              </div>
            )}

            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Report Submission History</h4>
                {taskHistoryQuery.isFetching ? (
                  <span className="text-xs text-muted-foreground">Refreshing…</span>
                ) : null}
              </div>

              <div className="grid grid-cols-1 gap-2 md:grid-cols-5">
                <div className="space-y-1">
                  <Label className="text-xs">Verdict</Label>
                  <Select
                    value={historyVerdict}
                    onValueChange={(v) => setHistoryVerdict(v as 'all' | TaskReportHistoryVerdict)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All verdicts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All verdicts</SelectItem>
                      <SelectItem value="needs_fix">needs_fix</SelectItem>
                      <SelectItem value="review_manually">review_manually</SelectItem>
                      <SelectItem value="reasonable">reasonable</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Min score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={historyMinScore}
                    onChange={(e) => setHistoryMinScore(e.target.value)}
                    placeholder="0"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Max score</Label>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={historyMaxScore}
                    onChange={(e) => setHistoryMaxScore(e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div className="space-y-1">
                  <Label className="text-xs">Rows/page</Label>
                  <Select
                    value={String(historyPageSize)}
                    onValueChange={(v) => setHistoryPageSize(Number(v))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="5">5</SelectItem>
                      <SelectItem value="10">10</SelectItem>
                      <SelectItem value="20">20</SelectItem>
                      <SelectItem value="50">50</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    className="w-full"
                    onClick={() => {
                      setHistoryVerdict('all');
                      setHistoryMinScore('');
                      setHistoryMaxScore('');
                      setDebouncedHistoryMinScore('');
                      setDebouncedHistoryMaxScore('');
                    }}
                  >
                    Reset filters
                  </Button>
                </div>
              </div>

              {taskHistoryQuery.isError ? (
                <p className="text-sm text-destructive">
                  {(taskHistoryQuery.error as Error).message || 'Failed to load report history'}
                </p>
              ) : null}

              {taskHistoryQuery.data?.items?.length ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Submitted At</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Verdict</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Preview</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {taskHistoryQuery.data.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          {formatDateTime(item.submittedAt || item.createdAt)}
                        </TableCell>
                        <TableCell>{item.score}/100</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{item.verdict}</Badge>
                        </TableCell>
                        <TableCell>{item.analysisSource}</TableCell>
                        <TableCell className="max-w-80 truncate">
                          {item.reportText}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">No report history yet for this task.</p>
              )}

              {taskHistoryQuery.data?.pagination ? (
                <div className="flex flex-col gap-2 pt-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
                  <span>
                    Showing page {taskHistoryQuery.data.pagination.page}/{taskHistoryQuery.data.pagination.totalPages}
                    {' '}({taskHistoryQuery.data.pagination.totalItems} item(s))
                  </span>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={taskHistoryQuery.data.pagination.page <= 1 || taskHistoryQuery.isFetching}
                      onClick={() => setHistoryPage((p) => Math.max(1, p - 1))}
                    >
                      Prev
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={
                        taskHistoryQuery.data.pagination.page >= taskHistoryQuery.data.pagination.totalPages ||
                        taskHistoryQuery.isFetching
                      }
                      onClick={() =>
                        setHistoryPage((p) =>
                          Math.min(taskHistoryQuery.data?.pagination.totalPages ?? p, p + 1),
                        )
                      }
                    >
                      Next
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>
          </div>

          <div className="space-y-4 rounded-lg border p-4">
            <h3 className="font-medium">Project Summary & Assignment Advice</h3>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={currentAdviceProjectId || ''}
                onValueChange={setAdviceProjectId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                variant="secondary"
                disabled={!currentAdviceProjectId || summaryMutation.isPending}
                onClick={() => {
                  if (!currentAdviceProjectId) return;
                  summaryMutation.mutate(
                    { projectId: currentAdviceProjectId },
                    {
                      onError: (err) => {
                        toast.error((err as Error).message || 'Failed to get summary');
                      },
                    },
                  );
                }}
              >
                {summaryMutation.isPending ? 'Generating…' : 'Generate Project Summary'}
              </Button>
            </div>

            {summaryMutation.data && (
              <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge>Total: {summaryMutation.data.summary.totalTasks}</Badge>
                  <Badge variant="secondary">Done: {summaryMutation.data.summary.doneTasks}</Badge>
                  <Badge variant="secondary">Overdue: {summaryMutation.data.summary.overdueTasks}</Badge>
                  <Badge variant="outline">
                    Completion: {summaryMutation.data.summary.completionRatePercent}%
                  </Badge>
                </div>
                <ul className="list-disc pl-5">
                  {summaryMutation.data.insights.map((insight) => (
                    <li key={insight}>{insight}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="space-y-2 border-t pt-3">
              <Label>Task title for assignment advice</Label>
              <Input
                value={adviceTaskTitle}
                onChange={(e) => setAdviceTaskTitle(e.target.value)}
                placeholder="Implement report validator"
              />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Estimated hours</Label>
                  <Input
                    type="number"
                    min={1}
                    value={adviceEstimatedHours}
                    onChange={(e) => setAdviceEstimatedHours(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Desired due date</Label>
                  <Input
                    type="datetime-local"
                    value={adviceDesiredDueDate}
                    onChange={(e) => setAdviceDesiredDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Required skills (comma separated)</Label>
                <Input
                  value={adviceRequiredSkills}
                  onChange={(e) => setAdviceRequiredSkills(e.target.value)}
                  placeholder="nestjs, task, notification"
                />
              </div>

              <Button
                variant="outline"
                disabled={
                  assignmentAdviceMutation.isPending ||
                  !currentAdviceProjectId ||
                  !adviceTaskTitle.trim() ||
                  Number(adviceEstimatedHours) < 1
                }
                onClick={() => {
                  if (!currentAdviceProjectId) return;

                  const candidates = (membersQuery.data ?? []).map((member) => ({
                    userId: member.id,
                    displayName: member.name,
                    skillTags: [],
                  }));

                  assignmentAdviceMutation.mutate(
                    {
                      projectId: currentAdviceProjectId,
                      input: {
                        taskTitle: adviceTaskTitle.trim(),
                        estimatedHours: Number(adviceEstimatedHours),
                        requiredSkills: adviceRequiredSkills
                          .split(',')
                          .map((x) => x.trim())
                          .filter(Boolean),
                        ...(adviceDesiredDueDate
                          ? {
                              desiredDueDate: new Date(
                                adviceDesiredDueDate,
                              ).toISOString(),
                            }
                          : {}),
                        candidates,
                      },
                    },
                    {
                      onError: (err) => {
                        toast.error(
                          (err as Error).message || 'Failed to generate assignment advice',
                        );
                      },
                    },
                  );
                }}
              >
                {assignmentAdviceMutation.isPending
                  ? 'Advising…'
                  : 'Get Assignment Advice'}
              </Button>

              {assignmentAdviceMutation.data && (
                <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                  <div>
                    Recommended: {assignmentAdviceMutation.data.recommendation?.displayName ?? 'N/A'}
                    {' '}({assignmentAdviceMutation.data.recommendation?.score ?? 0})
                  </div>
                  <div>
                    Suggested due:{' '}
                    {toLocalDatetimeInput(
                      assignmentAdviceMutation.data.schedule.suggestedDueDate,
                    ) || assignmentAdviceMutation.data.schedule.suggestedDueDate}
                  </div>
                  {assignmentAdviceMutation.data.schedule.warning ? (
                    <p className="text-amber-700">
                      {assignmentAdviceMutation.data.schedule.warning}
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
