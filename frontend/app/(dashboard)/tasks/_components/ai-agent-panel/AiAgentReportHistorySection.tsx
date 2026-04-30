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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { AiAgentReportHistorySectionProps } from '@/app/(dashboard)/tasks/_components/ai-agent-panel/types';

export function AiAgentReportHistorySection({
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
}: AiAgentReportHistorySectionProps) {
  return (
    <div className="space-y-2 text-black">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Report Submission History</h4>
        {taskHistoryIsFetching ? (
          <span className="text-xs text-zinc-400">Refreshing...</span>
        ) : null}
      </div>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <div className="space-y-1">
          <Label className="text-xs">Verdict</Label>
          <Select value={historyVerdict} onValueChange={onHistoryVerdictChange}>
            <SelectTrigger className="h-9 w-full min-w-0 border-zinc-300 bg-white text-black">
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
            onChange={(e) => onHistoryMinScoreChange(e.target.value)}
            placeholder="0"
            className="h-9 border-zinc-300 bg-white text-black placeholder:text-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Max score</Label>
          <Input
            type="number"
            min={0}
            max={100}
            value={historyMaxScore}
            onChange={(e) => onHistoryMaxScoreChange(e.target.value)}
            placeholder="100"
            className="h-9 border-zinc-300 bg-white text-black placeholder:text-zinc-400"
          />
        </div>

        <div className="space-y-1">
          <Label className="text-xs">Rows/page</Label>
          <Select
            value={String(historyPageSize)}
            onValueChange={(v) => onHistoryPageSizeChange(Number(v))}
          >
            <SelectTrigger className="h-9 w-full min-w-0 border-zinc-300 bg-white text-black">
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
            onClick={onHistoryReset}
          >
            Reset filters
          </Button>
        </div>
      </div>

      {taskHistoryIsError ? (
        <p className="text-sm text-destructive">
          {taskHistoryErrorMessage || 'Failed to load report history'}
        </p>
      ) : null}

      {taskHistoryResult?.items?.length ? (
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
            {taskHistoryResult.items.map((item) => (
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

      {taskHistoryResult?.pagination ? (
        <div className="flex flex-col gap-2 pt-2 text-xs text-zinc-400 md:flex-row md:items-center md:justify-between">
          <span>
            Showing page {taskHistoryResult.pagination.page}/
            {taskHistoryResult.pagination.totalPages} (
            {taskHistoryResult.pagination.totalItems} item(s))
          </span>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                taskHistoryResult.pagination.page <= 1 || taskHistoryIsFetching
              }
              onClick={onHistoryPrev}
            >
              Prev
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={
                taskHistoryResult.pagination.page >=
                  taskHistoryResult.pagination.totalPages ||
                taskHistoryIsFetching
              }
              onClick={onHistoryNext}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
