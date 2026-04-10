import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CreateTaskDto } from '@/contracts/task/dto/create-task.dto';
import type { TransitionTaskDto } from '@/contracts/task/dto/transition-task.dto';
import type { UpdateTaskDto } from '@/contracts/task/dto/update-task.dto';
import type { Subtask } from './schemas/task.schema';
import { ProjectColumnKey } from '@/contracts/project/project.enums';
import { TaskRepository } from './task.repository';

function canMarkDone(subtasks: Subtask[] | undefined): boolean {
  const list = subtasks ?? [];
  if (list.length === 0) return true;
  return list.every((s) => Boolean(s.isDone));
}

function normalizeAssigneeIds(dto: {
  assigneeIds?: unknown;
  assigneeId?: unknown;
}): string[] {
  if (Array.isArray(dto.assigneeIds)) {
    return dto.assigneeIds.filter(
      (v): v is string => typeof v === 'string' && v.length > 0,
    );
  }
  if (typeof dto.assigneeId === 'string' && dto.assigneeId)
    return [dto.assigneeId];
  return [];
}

@Injectable()
export class TaskService {
  constructor(private readonly repo: TaskRepository) {}

  async listTasks(
    projectId: string,
    query: { boardId?: string; columnKey?: string; assigneeId?: string },
  ) {
    return this.repo.findTasks({
      projectId,
      ...(query.boardId ? { boardId: query.boardId } : {}),
      ...(query.columnKey ? { columnKey: query.columnKey as any } : {}),
      ...(query.assigneeId ? { assigneeId: query.assigneeId } : {}),
    });
  }

  async createTask(createdBy: string, projectId: string, dto: CreateTaskDto) {
    const subtasks: Subtask[] = (dto.subtasks ?? []).map((s) => ({
      id: randomUUID(),
      title: s.title,
      isDone: Boolean(s.isDone),
    }));

    const assigneeIds = normalizeAssigneeIds(dto);
    const attachments = (dto.attachments ?? [])
      .filter((a) => a && typeof a.url === 'string' && a.url.trim().length > 0)
      .map((a) => ({
        url: a.url.trim(),
        ...(a.title ? { title: a.title.trim() } : {}),
      }));

    const task = await this.repo.createTask({
      projectId,
      boardId: dto.boardId,
      columnKey: dto.columnKey,
      title: dto.title,
      description: dto.description,
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      createdBy,
      assigneeId: assigneeIds[0],
      assigneeIds,
      priority: dto.priority,
      labelIds: dto.labelIds ?? [],
      subtasks,
      attachments,
      order: dto.order ?? 0,
    });
    return task.toObject();
  }

  async getTask(taskId: string) {
    const task = await this.repo.findTaskById(taskId);
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async updateTask(taskId: string, dto: UpdateTaskDto) {
    const patch: any = {
      ...(dto.title !== undefined ? { title: dto.title } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.dueDate !== undefined ? { dueDate: new Date(dto.dueDate) } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.columnKey !== undefined ? { columnKey: dto.columnKey } : {}),
      ...(dto.labelIds !== undefined ? { labelIds: dto.labelIds } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
    };

    if (dto.assigneeIds !== undefined) {
      const assigneeIds = normalizeAssigneeIds(dto);
      patch.assigneeIds = assigneeIds;
      patch.assigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null;
    } else if (dto.assigneeId !== undefined) {
      if (dto.assigneeId === null) {
        patch.assigneeIds = [];
        patch.assigneeId = null;
      } else {
        const assigneeIds = normalizeAssigneeIds(dto);
        patch.assigneeIds = assigneeIds;
        patch.assigneeId = assigneeIds.length > 0 ? assigneeIds[0] : null;
      }
    }

    if (dto.subtasks !== undefined) {
      const subtasks: Subtask[] = dto.subtasks.map((s) => ({
        id: s.id ?? randomUUID(),
        title: s.title ?? '',
        isDone: Boolean(s.isDone),
      }));

      const invalid = subtasks.some((s) => !s.title.trim());
      if (invalid) throw new BadRequestException('Subtask title is required');

      patch.subtasks = subtasks;
    }

    if (dto.attachments !== undefined) {
      const attachments = (dto.attachments ?? [])
        .filter(
          (a) => a && typeof a.url === 'string' && a.url.trim().length > 0,
        )
        .map((a) => ({
          url: a.url!.trim(),
          ...(a.title ? { title: a.title.trim() } : {}),
        }));
      patch.attachments = attachments;
    }

    if (dto.columnKey === ProjectColumnKey.done) {
      const current = await this.repo.findTaskById(taskId);
      if (!current) throw new NotFoundException('Task not found');

      const nextSubtasks: Subtask[] | undefined =
        patch.subtasks !== undefined
          ? (patch.subtasks as Subtask[])
          : (current as any).subtasks;

      if (!canMarkDone(nextSubtasks)) {
        throw new BadRequestException(
          'Cannot mark task as completed until progress is 100% (all subtasks done).',
        );
      }
    }

    const updated = await this.repo.updateTask(taskId, patch);
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async transitionTask(taskId: string, dto: TransitionTaskDto) {
    if (dto.columnKey === ProjectColumnKey.done) {
      const current = await this.repo.findTaskById(taskId);
      if (!current) throw new NotFoundException('Task not found');
      const subtasks: Subtask[] | undefined = (current as any).subtasks;

      if (!canMarkDone(subtasks)) {
        throw new BadRequestException(
          'Cannot mark task as completed until progress is 100% (all subtasks done).',
        );
      }
    }

    const updated = await this.repo.updateTask(taskId, {
      columnKey: dto.columnKey,
    });
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async deleteTask(taskId: string) {
    await this.getTask(taskId);
    const deleted = await this.repo.deleteTask(taskId);
    return { ok: Boolean(deleted) };
  }
}
