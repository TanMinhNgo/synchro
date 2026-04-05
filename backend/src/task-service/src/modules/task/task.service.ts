import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import type { CreateTaskDto } from '@/contracts/task/dto/create-task.dto';
import type { TransitionTaskDto } from '@/contracts/task/dto/transition-task.dto';
import type { UpdateTaskDto } from '@/contracts/task/dto/update-task.dto';
import type { Subtask } from './schemas/task.schema';
import { TaskRepository } from './task.repository';

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

    const task = await this.repo.createTask({
      projectId,
      boardId: dto.boardId,
      columnKey: dto.columnKey,
      title: dto.title,
      description: dto.description,
      createdBy,
      assigneeId: dto.assigneeId,
      priority: dto.priority,
      labelIds: dto.labelIds ?? [],
      subtasks,
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
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.assigneeId !== undefined ? { assigneeId: dto.assigneeId } : {}),
      ...(dto.priority !== undefined ? { priority: dto.priority } : {}),
      ...(dto.columnKey !== undefined ? { columnKey: dto.columnKey } : {}),
      ...(dto.labelIds !== undefined ? { labelIds: dto.labelIds } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
    };

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

    const updated = await this.repo.updateTask(taskId, patch);
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async transitionTask(taskId: string, dto: TransitionTaskDto) {
    const updated = await this.repo.updateTask(taskId, { columnKey: dto.columnKey });
    if (!updated) throw new NotFoundException('Task not found');
    return updated;
  }

  async deleteTask(taskId: string) {
    await this.getTask(taskId);
    const deleted = await this.repo.deleteTask(taskId);
    return { ok: Boolean(deleted) };
  }
}
