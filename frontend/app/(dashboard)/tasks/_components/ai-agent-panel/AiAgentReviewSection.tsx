'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { AiAgentReportHistorySection } from './AiAgentReportHistorySection';
import type { AiAgentReviewSectionProps } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

export function AiAgentReviewSection({
  reportTaskId,
  onReportTaskChange,
  taskOptions,
  reportText,
  onReportTextChange,
  progressPercent,
  onProgressChange,
  workedHours,
  onWorkedHoursChange,
  blockers,
  onBlockersChange,
  nextActions,
  onNextActionsChange,
  onSubmitReport,
  submitReportPending,
  submitReportResult,
  taskHistoryResult,
  taskHistoryIsFetching,
  taskHistoryIsError,
  taskHistoryErrorMessage,
  historyVerdict,
  onHistoryVerdictChange,
  historyMinScore,
  onHistoryMinScoreChange,
  historyMaxScore,
  onHistoryMaxScoreChange,
  historyPageSize,
  onHistoryPageSizeChange,
  onHistoryReset,
  onHistoryPrev,
  onHistoryNext,
  formatDateTime,
}: AiAgentReviewSectionProps) {
  const issues = submitReportResult?.issues ?? [];

  return (
    <div className="space-y-4 text-black">
      <h3 className="text-sm font-semibold">Auto Review Task Report</h3>

      <div className="space-y-2">
        <Label>Task</Label>
        <Select value={reportTaskId} onValueChange={onReportTaskChange}>
          <SelectTrigger className="border-zinc-300 bg-white text-black">
            <SelectValue placeholder="Select task" />
          </SelectTrigger>
          <SelectContent>
            {taskOptions.map((item: AiAgentReviewSectionProps['taskOptions'][number]) => (
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
          onChange={(e) => onReportTextChange(e.target.value)}
          rows={5}
          placeholder="Describe what was done, impact, blockers, and next actions"
          className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
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
            onChange={(e) => onProgressChange(e.target.value)}
            className="border-zinc-300 bg-white text-black"
          />
        </div>
        <div className="space-y-2">
          <Label>Worked hours</Label>
          <Input
            type="number"
            min={0}
            value={workedHours}
            onChange={(e) => onWorkedHoursChange(e.target.value)}
            className="border-zinc-300 bg-white text-black"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Blockers</Label>
        <Textarea
          value={blockers}
          onChange={(e) => onBlockersChange(e.target.value)}
          rows={2}
          placeholder="Optional blocker details"
          className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
        />
      </div>

      <div className="space-y-2">
        <Label>Next actions</Label>
        <Textarea
          value={nextActions}
          onChange={(e) => onNextActionsChange(e.target.value)}
          rows={2}
          placeholder="Optional next actions"
          className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
        />
      </div>

      <Button
        disabled={submitReportPending || !reportTaskId || reportText.trim().length < 20}
        onClick={onSubmitReport}
      >
        {submitReportPending ? 'Reviewing...' : 'Submit Report (Event-driven AI)'}
      </Button>

      {submitReportResult && (
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-zinc-300 text-black">
              {submitReportResult.analysisSource}
            </Badge>
            <Badge>
              {submitReportResult.verdict} - {submitReportResult.score}/100
            </Badge>
          </div>
          {submitReportResult.llmSummary ? (
            <p>{submitReportResult.llmSummary}</p>
          ) : null}
          {issues.length > 0 ? (
            <ul className="list-disc pl-5">
              {issues.slice(0, 4).map((issue) => (
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

      <AiAgentReportHistorySection
        taskHistoryResult={taskHistoryResult}
        taskHistoryIsFetching={taskHistoryIsFetching}
        taskHistoryIsError={taskHistoryIsError}
        taskHistoryErrorMessage={taskHistoryErrorMessage}
        historyVerdict={historyVerdict}
        onHistoryVerdictChange={onHistoryVerdictChange}
        historyMinScore={historyMinScore}
        onHistoryMinScoreChange={onHistoryMinScoreChange}
        historyMaxScore={historyMaxScore}
        onHistoryMaxScoreChange={onHistoryMaxScoreChange}
        historyPageSize={historyPageSize}
        onHistoryPageSizeChange={onHistoryPageSizeChange}
        onHistoryReset={onHistoryReset}
        onHistoryPrev={onHistoryPrev}
        onHistoryNext={onHistoryNext}
        formatDateTime={formatDateTime}
      />
    </div>
  );
}
