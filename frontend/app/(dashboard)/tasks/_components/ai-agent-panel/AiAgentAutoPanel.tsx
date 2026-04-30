'use client';

import * as React from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AiAgentReviewSection } from './AiAgentReviewSection';
import { AiAgentAdviceSection } from './AiAgentAdviceSection';
import type { AiAgentAutoPanelProps } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

export function AiAgentAutoPanel({
  activeTab,
  onChangeTab,
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
  currentAdviceProjectId,
  projects,
  onAdviceProjectChange,
  onRunSummary,
  summaryPending,
  summaryResult,
  adviceTaskTitle,
  onAdviceTaskTitleChange,
  adviceEstimatedHours,
  onAdviceEstimatedHoursChange,
  adviceDesiredDueDate,
  onAdviceDesiredDueDateChange,
  adviceRequiredSkills,
  onAdviceRequiredSkillsChange,
  onRunAssignmentAdvice,
  assignmentAdvicePending,
  assignmentAdviceResult,
  formatDateTime,
  toLocalDatetimeInput,
}: AiAgentAutoPanelProps) {
  return (
    <ScrollArea className="h-full bg-white text-black">
      <div className="space-y-4 p-4">
        <div className="flex items-center gap-2 border-b border-zinc-200 pb-2">
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={
              activeTab === 'review'
                ? 'flex-1 border-b-2 border-black text-black'
                : 'flex-1 text-zinc-500 hover:text-black'
            }
            onClick={() => onChangeTab('review')}
          >
            Review
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className={
              activeTab === 'advice'
                ? 'flex-1 border-b-2 border-black text-black'
                : 'flex-1 text-zinc-500 hover:text-black'
            }
            onClick={() => onChangeTab('advice')}
          >
            Advice
          </Button>
          <Sparkles className="mr-1 size-4 text-zinc-500" />
        </div>

        {activeTab === 'review' ? (
          <AiAgentReviewSection
            reportTaskId={reportTaskId}
            onReportTaskChange={onReportTaskChange}
            taskOptions={taskOptions}
            reportText={reportText}
            onReportTextChange={onReportTextChange}
            progressPercent={progressPercent}
            onProgressChange={onProgressChange}
            workedHours={workedHours}
            onWorkedHoursChange={onWorkedHoursChange}
            blockers={blockers}
            onBlockersChange={onBlockersChange}
            nextActions={nextActions}
            onNextActionsChange={onNextActionsChange}
            onSubmitReport={onSubmitReport}
            submitReportPending={submitReportPending}
            submitReportResult={submitReportResult}
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
        ) : null}

        {activeTab === 'advice' ? (
          <AiAgentAdviceSection
            currentAdviceProjectId={currentAdviceProjectId}
            projects={projects}
            onAdviceProjectChange={onAdviceProjectChange}
            onRunSummary={onRunSummary}
            summaryPending={summaryPending}
            summaryResult={summaryResult}
            adviceTaskTitle={adviceTaskTitle}
            onAdviceTaskTitleChange={onAdviceTaskTitleChange}
            adviceEstimatedHours={adviceEstimatedHours}
            onAdviceEstimatedHoursChange={onAdviceEstimatedHoursChange}
            adviceDesiredDueDate={adviceDesiredDueDate}
            onAdviceDesiredDueDateChange={onAdviceDesiredDueDateChange}
            adviceRequiredSkills={adviceRequiredSkills}
            onAdviceRequiredSkillsChange={onAdviceRequiredSkillsChange}
            onRunAssignmentAdvice={onRunAssignmentAdvice}
            assignmentAdvicePending={assignmentAdvicePending}
            assignmentAdviceResult={assignmentAdviceResult}
            toLocalDatetimeInput={toLocalDatetimeInput}
          />
        ) : null}
      </div>
    </ScrollArea>
  );
}
