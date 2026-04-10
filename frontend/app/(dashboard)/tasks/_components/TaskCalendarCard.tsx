'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import type { Task } from '@/shared/types/api/task';
import { addDays, sameLocalDay, startOfLocalDay } from './task-utils';

type Item = { task: Task; projectId: string; projectName: string };

export function TaskCalendarCard({
  items,
  isLoading,
  isError,
}: {
  items: Item[];
  isLoading: boolean;
  isError: boolean;
}) {
  const calendar = React.useMemo(() => {
    const today = startOfLocalDay(new Date());
    const start = addDays(today, -3);
    const days = Array.from({ length: 8 }, (_, i) => addDays(start, i));

    const tasks = items
      .map((it) => {
        const dueRaw = it.task.dueDate;
        if (!dueRaw) return null;
        const due = new Date(dueRaw);
        if (Number.isNaN(due.getTime())) return null;
        const dueDay = startOfLocalDay(due);
        const index = Math.floor(
          (dueDay.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
        );
        if (index < 0 || index >= days.length) return null;
        return { ...it, due, dayIndex: index };
      })
      .filter(Boolean) as Array<Item & { due: Date; dayIndex: number }>;

    const tasksByDay = new Map<number, typeof tasks>();
    for (const t of tasks) {
      const arr = tasksByDay.get(t.dayIndex) ?? [];
      arr.push(t);
      tasksByDay.set(t.dayIndex, arr);
    }

    for (const [k, arr] of tasksByDay) {
      arr.sort((a, b) => a.due.getTime() - b.due.getTime());
      tasksByDay.set(k, arr);
    }

    const todayIndex = days.findIndex((d) => sameLocalDay(d, today));

    return { days, todayIndex, tasksByDay };
  }, [items]);

  return (
    <Card className="shrink-0 p-4 flex flex-col gap-4 border-black/5 shadow-sm rounded-2xl mx-2 mt-2">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold">Task Calendar</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground border rounded-lg"
        >
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </div>

      <div className="relative h-62 shrink-0 w-full border-t border-b overflow-hidden flex flex-col bg-white">
        <div className="grid grid-cols-8 w-full text-center text-[13px] font-medium text-muted-foreground mt-4 mb-2 z-10">
          {calendar.days.map((d, idx) => {
            const label = d.toLocaleDateString(undefined, {
              day: '2-digit',
              month: 'short',
            });
            const isToday = idx === calendar.todayIndex;
            return (
              <span
                key={d.toISOString()}
                className={isToday ? 'text-foreground font-bold' : undefined}
              >
                {label}
              </span>
            );
          })}
        </div>

        <div className="relative flex-1 w-full border-t">
          <div className="absolute inset-0 grid grid-cols-8">
            {calendar.days.map((d, dayIndex) => {
              const dayTasks = calendar.tasksByDay.get(dayIndex) ?? [];
              const isToday = dayIndex === calendar.todayIndex;
              return (
                <div
                  key={d.toISOString()}
                  className="border-l border-black/5 relative"
                >
                  {isToday && (
                    <div className="absolute top-0 bottom-0 left-0 w-[1.5px] bg-foreground z-10">
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-[5px] border-l-transparent border-r-transparent border-t-foreground" />
                    </div>
                  )}

                  {dayTasks.map((t, i) => {
                    const top = 30 + i * 45;
                    return (
                      <div
                        key={t.task.id}
                        className="absolute left-2 bg-muted text-muted-foreground text-[12px] px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 shadow-sm whitespace-nowrap max-w-[95%]"
                        style={{ top: `${top}px` }}
                        title={`${t.projectName}: ${t.task.title}`}
                      >
                        <span className="truncate">{t.task.title}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>

          {items.length > 0 && calendar.tasksByDay.size === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No upcoming deadlines in this range.
            </div>
          )}

          {items.length === 0 && !isLoading && !isError && (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              No tasks to display.
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}
