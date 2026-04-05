import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import type { CreateTaskDto } from '@/contracts/task/dto/create-task.dto';
import type { TransitionTaskDto } from '@/contracts/task/dto/transition-task.dto';
import type { UpdateTaskDto } from '@/contracts/task/dto/update-task.dto';
import { taskServiceSubjects } from '@/contracts/task/task.subjects';
import {
  TASK_SERVICE_NATS_CLIENT,
} from './task-service.nats';

@Injectable()
export class TaskServiceClient {
  constructor(
    @Inject(TASK_SERVICE_NATS_CLIENT) private readonly client: ClientProxy,
  ) {}

  private async send<Req, Res>(subject: string, payload: Req): Promise<Res> {
    try {
      return await firstValueFrom(
        this.client.send<Res, Req>(subject, payload).pipe(timeout(5000)),
      );
    } catch {
      throw new BadGatewayException('task-service (NATS) request failed');
    }
  }

  listByProject(
    userId: string,
    projectId: string,
    query: { boardId?: string; columnKey?: string; assigneeId?: string },
  ) {
    return this.send<
      {
        userId: string;
        projectId: string;
        query: { boardId?: string; columnKey?: string; assigneeId?: string };
      },
      { tasks: unknown[] }
    >(taskServiceSubjects.listByProject, { userId, projectId, query });
  }

  create(userId: string, projectId: string, dto: CreateTaskDto) {
    return this.send<
      { userId: string; projectId: string; dto: CreateTaskDto },
      { task: unknown }
    >(taskServiceSubjects.create, { userId, projectId, dto });
  }

  get(userId: string, taskId: string) {
    return this.send<{ userId: string; taskId: string }, { task: unknown }>(
      taskServiceSubjects.get,
      { userId, taskId },
    );
  }

  update(userId: string, taskId: string, dto: UpdateTaskDto) {
    return this.send<
      { userId: string; taskId: string; dto: UpdateTaskDto },
      { task: unknown }
    >(taskServiceSubjects.update, { userId, taskId, dto });
  }

  transition(userId: string, taskId: string, dto: TransitionTaskDto) {
    return this.send<
      { userId: string; taskId: string; dto: TransitionTaskDto },
      { task: unknown }
    >(taskServiceSubjects.transition, { userId, taskId, dto });
  }

  delete(userId: string, taskId: string) {
    return this.send<{ userId: string; taskId: string }, { ok: boolean }>(
      taskServiceSubjects.delete,
      { userId, taskId },
    );
  }
}
