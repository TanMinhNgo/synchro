import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateTaskDto } from '@/contracts/task/dto/create-task.dto';
import type { TransitionTaskDto } from '@/contracts/task/dto/transition-task.dto';
import type { UpdateTaskDto } from '@/contracts/task/dto/update-task.dto';
import { taskServiceSubjects } from '@/contracts/task/task.subjects';
import { TaskService } from './task.service';

@Controller()
export class TaskNatsController {
  constructor(private readonly tasks: TaskService) {}

  @MessagePattern(taskServiceSubjects.listByProject)
  async listByProject(
    @Payload()
    payload: {
      userId?: string;
      projectId: string;
      query: { boardId?: string; columnKey?: string; assigneeId?: string };
    },
  ) {
    const tasks = await this.tasks.listTasks(payload.projectId, payload.query);
    return { tasks };
  }

  @MessagePattern(taskServiceSubjects.create)
  async create(
    @Payload()
    payload: {
      userId: string;
      projectId: string;
      dto: CreateTaskDto;
    },
  ) {
    const task = await this.tasks.createTask(
      payload.userId,
      payload.projectId,
      payload.dto,
    );
    return { task };
  }

  @MessagePattern(taskServiceSubjects.get)
  async get(@Payload() payload: { userId?: string; taskId: string }) {
    const task = await this.tasks.getTask(payload.taskId);
    return { task };
  }

  @MessagePattern(taskServiceSubjects.update)
  async update(
    @Payload() payload: { userId?: string; taskId: string; dto: UpdateTaskDto },
  ) {
    const task = await this.tasks.updateTask(payload.taskId, payload.dto);
    return { task };
  }

  @MessagePattern(taskServiceSubjects.transition)
  async transition(
    @Payload()
    payload: {
      userId?: string;
      taskId: string;
      dto: TransitionTaskDto;
    },
  ) {
    const task = await this.tasks.transitionTask(payload.taskId, payload.dto);
    return { task };
  }

  @MessagePattern(taskServiceSubjects.delete)
  async delete(@Payload() payload: { userId?: string; taskId: string }) {
    return this.tasks.deleteTask(payload.taskId);
  }
}
