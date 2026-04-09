'use client';

import type { Task } from '@/shared/types/api/task';

export function formatDeadline(value?: string) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    return d.toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

export function datetimeLocalToIso(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const d = new Date(trimmed);
    if (Number.isNaN(d.getTime())) return undefined;
    return d.toISOString();
}

export function isoToDatetimeLocal(value?: string) {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    const yyyy = d.getFullYear();
    const mm = pad(d.getMonth() + 1);
    const dd = pad(d.getDate());
    const hh = pad(d.getHours());
    const min = pad(d.getMinutes());
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
}

export function newLocalId() {
    return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;
}

export function calcProgress(task: Pick<Task, 'columnKey' | 'subtasks'>) {
    if (task.columnKey === 'done') return 100;
    const subtasks = task.subtasks ?? [];
    if (subtasks.length === 0) return 0;
    const done = subtasks.filter((s) => s.isDone).length;
    return Math.round((done / subtasks.length) * 100);
}

export function countSubtasks(task: Pick<Task, 'subtasks'>) {
    const subtasks = task.subtasks ?? [];
    const total = subtasks.length;
    const done = subtasks.filter((s) => s.isDone).length;
    return { done, total };
}

export function startOfLocalDay(d: Date) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function addDays(d: Date, days: number) {
    const copy = new Date(d);
    copy.setDate(copy.getDate() + days);
    return copy;
}

export function sameLocalDay(a: Date, b: Date) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
