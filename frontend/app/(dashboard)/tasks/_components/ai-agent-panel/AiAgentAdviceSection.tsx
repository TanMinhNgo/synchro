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
import type { AiAgentAdviceSectionProps } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

export function AiAgentAdviceSection({
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
  toLocalDatetimeInput,
}: AiAgentAdviceSectionProps) {
  return (
    <div className="space-y-4 text-black">
      <h3 className="text-sm font-semibold">Project Summary and Assignment Advice</h3>

      <div className="space-y-2">
        <Label>Project</Label>
        <Select value={currentAdviceProjectId || ''} onValueChange={onAdviceProjectChange}>
          <SelectTrigger className="border-zinc-300 bg-white text-black">
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
          disabled={!currentAdviceProjectId || summaryPending}
          onClick={onRunSummary}
        >
          {summaryPending ? 'Generating...' : 'Generate Project Summary'}
        </Button>
      </div>

      {summaryResult && (
        <div className="space-y-2 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <Badge className="border-zinc-300 text-black" variant="outline">
              Total: {summaryResult.summary.totalTasks}
            </Badge>
            <Badge className="border-zinc-300 text-black" variant="outline">
              Done: {summaryResult.summary.doneTasks}
            </Badge>
            <Badge className="border-zinc-300 text-black" variant="outline">
              Overdue: {summaryResult.summary.overdueTasks}
            </Badge>
            <Badge className="border-zinc-300 text-black" variant="outline">
              Completion: {summaryResult.summary.completionRatePercent}%
            </Badge>
          </div>
          <ul className="list-disc pl-5">
            {summaryResult.insights.map((insight) => (
              <li key={insight}>{insight}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-2 pt-3">
        <Label>Task title for assignment advice</Label>
        <Input
          value={adviceTaskTitle}
          onChange={(e) => onAdviceTaskTitleChange(e.target.value)}
          placeholder="Implement report validator"
          className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
        />

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Estimated hours</Label>
            <Input
              type="number"
              min={1}
              value={adviceEstimatedHours}
              onChange={(e) => onAdviceEstimatedHoursChange(e.target.value)}
              className="border-zinc-300 bg-white text-black"
            />
          </div>
          <div className="space-y-2">
            <Label>Desired due date</Label>
            <Input
              type="datetime-local"
              value={adviceDesiredDueDate}
              onChange={(e) => onAdviceDesiredDueDateChange(e.target.value)}
              className="border-zinc-300 bg-white text-black"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Required skills (comma separated)</Label>
          <Input
            value={adviceRequiredSkills}
            onChange={(e) => onAdviceRequiredSkillsChange(e.target.value)}
            placeholder="nestjs, task, notification"
            className="border-zinc-300 bg-white text-black placeholder:text-zinc-400"
          />
        </div>

        <Button
          variant="outline"
          disabled={
            assignmentAdvicePending ||
            !currentAdviceProjectId ||
            !adviceTaskTitle.trim() ||
            Number(adviceEstimatedHours) < 1
          }
          onClick={onRunAssignmentAdvice}
        >
          {assignmentAdvicePending ? 'Advising...' : 'Get Assignment Advice'}
        </Button>

        {assignmentAdviceResult && (
          <div className="space-y-2 text-sm">
            <div>
              Recommended: {assignmentAdviceResult.recommendation?.displayName ?? 'N/A'} (
              {assignmentAdviceResult.recommendation?.score ?? 0})
            </div>
            <div>
              Suggested due:{' '}
              {toLocalDatetimeInput(assignmentAdviceResult.schedule.suggestedDueDate) ||
                assignmentAdviceResult.schedule.suggestedDueDate}
            </div>
            {assignmentAdviceResult.schedule.warning ? (
              <p className="text-amber-300">
                {assignmentAdviceResult.schedule.warning}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
