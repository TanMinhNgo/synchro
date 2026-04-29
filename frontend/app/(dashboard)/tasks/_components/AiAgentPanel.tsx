'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Bot, SendHorizontal, Sparkles, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
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

type ChatMessage = {
  id: string;
  role: 'bot' | 'user';
  text: string;
};

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
    `Completed subtasks: ${doneSubtasks.length > 0
      ? doneSubtasks.map((s) => s.title).join('; ')
      : 'None reported'
    }`,
    `Pending subtasks: ${pendingSubtasks.length > 0
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
  const [isOpen, setIsOpen] = React.useState(true);
  const [panelMode, setPanelMode] = React.useState<'chat' | 'auto'>('chat');
  const [activeTab, setActiveTab] = React.useState<'review' | 'advice'>('review');
  const [chatInput, setChatInput] = React.useState('');
  const [chatMessages, setChatMessages] = React.useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'bot',
      text: 'Hi, I am Synchro AI. You can ask me to review a report, summarize a project, or suggest assignee.',
    },
  ]);

  const appendChatMessage = React.useCallback(
    (role: 'bot' | 'user', text: string) => {
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
          role,
          text,
        },
      ]);
    },
    [],
  );

  const chatViewportRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    chatViewportRef.current?.scrollTo({
      top: chatViewportRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [chatMessages]);

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
    if (selectedProjectId !== 'all') {
      setAdviceProjectId(selectedProjectId);
    }
  }, [selectedProjectId]);

  const currentAdviceProjectId =
    adviceProjectId || (selectedProjectId !== 'all' ? selectedProjectId : '');

  const taskOptions = React.useMemo(() => {
    const list =
      selectedProjectId === 'all'
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
    if (!currentAdviceProjectId) {
      appendChatMessage('bot', 'Please select a project first, then ask for summary again.');
      return;
    }

    summaryMutation.mutate(
      { projectId: currentAdviceProjectId },
      {
        onSuccess: (res) => {
          appendChatMessage(
            'bot',
            `Summary ready: ${res.summary.doneTasks}/${res.summary.totalTasks} done, ${res.summary.overdueTasks} overdue.`,
          );
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to get summary');
          appendChatMessage('bot', 'I could not generate project summary right now.');
        },
      },
    );
  }, [appendChatMessage, currentAdviceProjectId, summaryMutation]);

  const runReportReview = React.useCallback(() => {
    if (!reportTask || reportText.trim().length < 20) {
      appendChatMessage(
        'bot',
        'Please choose a task and provide at least 20 characters in report text before review.',
      );
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
          appendChatMessage(
            'bot',
            `Review complete: ${display.verdict} (${display.scoreText}).`,
          );
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to submit report');
          appendChatMessage('bot', 'I could not review this report right now.');
        },
      },
    );
  }, [
    appendChatMessage,
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
    if (
      !currentAdviceProjectId ||
      !adviceTaskTitle.trim() ||
      Number(adviceEstimatedHours) < 1
    ) {
      appendChatMessage(
        'bot',
        'Please select project, fill task title, and set estimated hours before asking assignment advice.',
      );
      return;
    }

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
                desiredDueDate: new Date(adviceDesiredDueDate).toISOString(),
              }
            : {}),
          candidates,
        },
      },
      {
        onSuccess: (res) => {
          appendChatMessage(
            'bot',
            `Advice ready: recommend ${res.recommendation?.displayName ?? 'N/A'} (${res.recommendation?.score ?? 0}).`,
          );
        },
        onError: (err) => {
          toast.error((err as Error).message || 'Failed to generate assignment advice');
          appendChatMessage('bot', 'I could not generate assignment advice now.');
        },
      },
    );
  }, [
    adviceDesiredDueDate,
    adviceEstimatedHours,
    adviceRequiredSkills,
    adviceTaskTitle,
    appendChatMessage,
    assignmentAdviceMutation,
    currentAdviceProjectId,
    membersQuery.data,
  ]);

  const handleSendChat = React.useCallback(() => {
    const message = chatInput.trim();
    if (!message) return;

    appendChatMessage('user', message);
    setChatInput('');

    const normalized = message.toLowerCase();

    if (normalized.includes('review') || normalized.includes('bao cao') || normalized.includes('report')) {
      setActiveTab('review');
      runReportReview();
      return;
    }

    if (normalized.includes('summary') || normalized.includes('tong quan')) {
      setActiveTab('advice');
      runSummary();
      return;
    }

    if (normalized.includes('advice') || normalized.includes('assign') || normalized.includes('goi y')) {
      setActiveTab('advice');
      runAssignmentAdvice();
      return;
    }

    appendChatMessage(
      'bot',
      'Try: "review report", "project summary", or "assignment advice". You can also use quick buttons below.',
    );
  }, [
    appendChatMessage,
    chatInput,
    runAssignmentAdvice,
    runReportReview,
    runSummary,
  ]);

  return (
    <div className="pointer-events-none fixed right-4 bottom-4 z-50 sm:right-6 sm:bottom-6">
      <div className="pointer-events-auto flex flex-col items-end gap-3">
        {isOpen ? (
          <div className="h-176 w-[min(96vw,28rem)] overflow-hidden rounded-3xl border border-zinc-700/70 bg-zinc-900 text-zinc-100 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.9)]">
            <div className="flex items-center justify-between border-b border-zinc-700/70 bg-zinc-950/90 px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex size-9 items-center justify-center rounded-full bg-orange-500/20 text-orange-300">
                  <Bot className="size-5" />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-zinc-100">
                    Synchro AI Agent
                  </p>
                  <p className="truncate text-xs text-zinc-400">
                    Chat to review, summarize, and assign
                  </p>
                </div>
              </div>

              <Button
                size="icon"
                variant="ghost"
                className="size-8 rounded-full text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100"
                onClick={() => setIsOpen(false)}
                aria-label="Close AI agent panel"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="space-y-2 p-2">
              <div className="flex items-center gap-2 rounded-xl border border-zinc-700/70 bg-zinc-950/70 p-1">
                <Button
                  type="button"
                  size="sm"
                  variant={panelMode === 'chat' ? 'default' : 'ghost'}
                  className={
                    panelMode === 'chat'
                      ? 'flex-1 bg-orange-500 text-zinc-950 hover:bg-orange-400'
                      : 'flex-1 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                  }
                  onClick={() => setPanelMode('chat')}
                >
                  Chat
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={panelMode === 'auto' ? 'default' : 'ghost'}
                  className={
                    panelMode === 'auto'
                      ? 'flex-1 bg-orange-500 text-zinc-950 hover:bg-orange-400'
                      : 'flex-1 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                  }
                  onClick={() => setPanelMode('auto')}
                >
                  Auto
                </Button>
                <Sparkles className="mr-1 size-4 text-orange-300" />
              </div>

              {panelMode === 'chat' ? (
                <div className="rounded-2xl border border-zinc-700/70 bg-zinc-950/60 p-2">
                  <ScrollArea className="h-120">
                    <div
                      ref={chatViewportRef}
                      className="space-y-2 pr-2"
                    >
                      {chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
                              message.role === 'user'
                                ? 'rounded-br-md bg-orange-500 text-zinc-950'
                                : 'rounded-bl-md bg-zinc-800 text-zinc-100'
                            }`}
                          >
                            {message.text}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>

                  <div className="mt-3 flex gap-2">
                    <Input
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleSendChat();
                        }
                      }}
                      placeholder="Ask AI: review report / project summary / assignment advice"
                      className="border-zinc-700 bg-zinc-900 text-zinc-100 placeholder:text-zinc-500"
                    />
                    <Button
                      size="icon"
                      className="shrink-0 bg-orange-500 text-zinc-950 hover:bg-orange-400"
                      onClick={handleSendChat}
                      aria-label="Send message"
                    >
                      <SendHorizontal className="size-4" />
                    </Button>
                  </div>

                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-3">
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      onClick={() => {
                        appendChatMessage('user', 'Review report now');
                        setActiveTab('review');
                        runReportReview();
                      }}
                    >
                      Review report
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      onClick={() => {
                        appendChatMessage('user', 'Generate project summary');
                        setActiveTab('advice');
                        runSummary();
                      }}
                    >
                      Project summary
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="secondary"
                      className="bg-zinc-800 text-zinc-100 hover:bg-zinc-700"
                      onClick={() => {
                        appendChatMessage('user', 'Suggest assignee');
                        setActiveTab('advice');
                        runAssignmentAdvice();
                      }}
                    >
                      Assignment advice
                    </Button>
                  </div>
                </div>
              ) : null}

              {panelMode === 'auto' ? (
                <ScrollArea className="h-120 rounded-2xl border border-zinc-700/70 bg-zinc-900/35">
                <div className="space-y-4 p-4">
                  <div className="flex items-center gap-2 rounded-xl border border-zinc-700/70 bg-zinc-950/70 p-1">
                    <Button
                      type="button"
                      size="sm"
                      variant={activeTab === 'review' ? 'default' : 'ghost'}
                      className={
                        activeTab === 'review'
                          ? 'flex-1 bg-orange-500 text-zinc-950 hover:bg-orange-400'
                          : 'flex-1 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                      }
                      onClick={() => setActiveTab('review')}
                    >
                      Review
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={activeTab === 'advice' ? 'default' : 'ghost'}
                      className={
                        activeTab === 'advice'
                          ? 'flex-1 bg-orange-500 text-zinc-950 hover:bg-orange-400'
                          : 'flex-1 text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100'
                      }
                      onClick={() => setActiveTab('advice')}
                    >
                      Advice
                    </Button>
                    <Sparkles className="mr-1 size-4 text-orange-300" />
                  </div>

                  {activeTab === 'review' ? (
                    <div className="space-y-4 rounded-2xl border border-zinc-700/80 bg-zinc-900/40 p-4">
                    <h3 className="text-sm font-semibold">Auto Review Task Report</h3>

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
                      onClick={runReportReview}
                    >
                      {submitReportMutation.isPending
                        ? 'Reviewing...'
                        : 'Submit Report (Event-driven AI)'}
                    </Button>

                    {submitReportMutation.data && (
                      <div className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-800/40 p-3 text-sm">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {submitReportMutation.data.analysisSource}
                          </Badge>
                          <Badge>
                            {submitReportMutation.data.verdict} -{' '}
                            {submitReportMutation.data.score}/100
                          </Badge>
                        </div>
                        {submitReportMutation.data.llmSummary ? (
                          <p>{submitReportMutation.data.llmSummary}</p>
                        ) : null}
                        {submitReportMutation.data.issues.length > 0 ? (
                          <ul className="list-disc pl-5">
                            {submitReportMutation.data.issues
                              .slice(0, 4)
                              .map((issue) => (
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

                    <div className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-800/20 p-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Report Submission History</h4>
                        {taskHistoryQuery.isFetching ? (
                          <span className="text-xs text-zinc-400">Refreshing...</span>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                        <div className="space-y-1">
                          <Label className="text-xs">Verdict</Label>
                          <Select
                            value={historyVerdict}
                            onValueChange={(v) =>
                              setHistoryVerdict(v as 'all' | TaskReportHistoryVerdict)
                            }
                          >
                            <SelectTrigger className="h-9 w-full min-w-0">
                              <SelectValue placeholder="All verdicts" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All verdicts</SelectItem>
                              <SelectItem value="needs_fix">needs_fix</SelectItem>
                              <SelectItem value="review_manually">
                                review_manually
                              </SelectItem>
                              <SelectItem value="reasonable">reasonable</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-1">
                          <Label className="text-xs">Min score</Label>
                          <Input
                            className="h-9"
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
                            className="h-9"
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
                            <SelectTrigger className="h-9 w-full min-w-0">
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

                        <div className="flex items-end sm:col-span-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-9 w-full"
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
                          {(taskHistoryQuery.error as Error).message ||
                            'Failed to load report history'}
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
                        <p className="text-sm text-zinc-400">
                          No report history yet for this task.
                        </p>
                      )}

                      {taskHistoryQuery.data?.pagination ? (
                        <div className="flex flex-col gap-2 pt-2 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between">
                          <span>
                            Showing page {taskHistoryQuery.data.pagination.page}/
                            {taskHistoryQuery.data.pagination.totalPages} (
                            {taskHistoryQuery.data.pagination.totalItems} item(s))
                          </span>
                          <div className="flex items-center gap-2">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                taskHistoryQuery.data.pagination.page <= 1 ||
                                taskHistoryQuery.isFetching
                              }
                              onClick={() =>
                                setHistoryPage((p) => Math.max(1, p - 1))
                              }
                            >
                              Prev
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={
                                taskHistoryQuery.data.pagination.page >=
                                taskHistoryQuery.data.pagination.totalPages ||
                                taskHistoryQuery.isFetching
                              }
                              onClick={() =>
                                setHistoryPage((p) =>
                                  Math.min(
                                    taskHistoryQuery.data?.pagination.totalPages ?? p,
                                    p + 1,
                                  ),
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
                  ) : null}

                  {activeTab === 'advice' ? (
                    <div className="space-y-4 rounded-2xl border border-zinc-700/80 bg-zinc-900/40 p-4">
                      <h3 className="text-sm font-semibold">
                        Project Summary and Assignment Advice
                      </h3>

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
                          onClick={runSummary}
                        >
                          {summaryMutation.isPending
                            ? 'Generating...'
                            : 'Generate Project Summary'}
                        </Button>
                      </div>

                      {summaryMutation.data && (
                        <div className="space-y-2 rounded-md border bg-muted/30 p-3 text-sm">
                          <div className="flex flex-wrap items-center gap-2">
                            <Badge>
                              Total: {summaryMutation.data.summary.totalTasks}
                            </Badge>
                            <Badge variant="secondary">
                              Done: {summaryMutation.data.summary.doneTasks}
                            </Badge>
                            <Badge variant="secondary">
                              Overdue: {summaryMutation.data.summary.overdueTasks}
                            </Badge>
                            <Badge variant="outline">
                              Completion:{' '}
                              {summaryMutation.data.summary.completionRatePercent}%
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
                          onClick={runAssignmentAdvice}
                        >
                          {assignmentAdviceMutation.isPending
                            ? 'Advising...'
                            : 'Get Assignment Advice'}
                        </Button>

                        {assignmentAdviceMutation.data && (
                          <div className="space-y-2 rounded-xl border border-zinc-700/80 bg-zinc-800/40 p-3 text-sm">
                            <div>
                              Recommended:{' '}
                              {assignmentAdviceMutation.data.recommendation
                                ?.displayName ?? 'N/A'}{' '}
                              ({assignmentAdviceMutation.data.recommendation?.score ?? 0})
                            </div>
                            <div>
                              Suggested due:{' '}
                              {toLocalDatetimeInput(
                                assignmentAdviceMutation.data.schedule.suggestedDueDate,
                              ) ||
                                assignmentAdviceMutation.data.schedule.suggestedDueDate}
                            </div>
                            {assignmentAdviceMutation.data.schedule.warning ? (
                              <p className="text-amber-300">
                                {assignmentAdviceMutation.data.schedule.warning}
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : null}
                </div>
                </ScrollArea>
              ) : null}
            </div>
          </div>
        ) : null}

        <Button
          type="button"
          size="lg"
          className="h-12 rounded-full bg-orange-500 px-5 font-semibold text-zinc-950 hover:bg-orange-400"
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <Bot className="mr-2 size-5" />
          {isOpen ? 'Hide AI Agent' : 'Open AI Agent'}
        </Button>
      </div>
    </div>
  );
}
