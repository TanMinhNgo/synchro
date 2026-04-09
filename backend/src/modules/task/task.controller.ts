import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserClaims } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { CreateTaskDto } from '@/contracts/task/dto/create-task.dto';
import { TransitionTaskDto } from '@/contracts/task/dto/transition-task.dto';
import { UpdateTaskDto } from '@/contracts/task/dto/update-task.dto';
import { ProjectServiceClient } from '@/modules/project/project-service.client';
import { TaskServiceClient } from './task-service.client';

function getTaskProjectId(task: unknown): string {
  if (!task || typeof task !== 'object')
    throw new Error('Invalid task payload');
  const projectId = (task as { projectId?: unknown }).projectId;
  if (typeof projectId !== 'string' || !projectId)
    throw new Error('Invalid task payload');
  return projectId;
}

function getProjectId(project: unknown): string {
  if (!project || typeof project !== 'object')
    throw new Error('Invalid project payload');
  const raw = (project as { id?: unknown; _id?: unknown }).id ??
    (project as { id?: unknown; _id?: unknown })._id;
  if (typeof raw === 'string' && raw) return raw;
  if (raw && typeof raw === 'object' && 'toString' in raw) {
    const v = (raw as { toString: () => string }).toString();
    if (v) return v;
  }
  throw new Error('Invalid project payload');
}

@Controller()
@ApiTags('tasks')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class TaskController {
  constructor(
    private readonly tasks: TaskServiceClient,
    private readonly projects: ProjectServiceClient,
  ) {}

  @Get('projects/:projectId/tasks')
  @ApiOperation({ summary: 'List tasks in a project (optional filters)' })
  @ApiOkResponse({ description: 'Tasks list' })
  listTasks(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Query('boardId') boardId?: string,
    @Query('columnKey') columnKey?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    const userId = (user as CurrentUserClaims).sub;
    return this.projects.getProject(userId, projectId).then((p) => {
      const resolvedProjectId = getProjectId(p.project);
      return this.tasks
        .listByProject(userId, resolvedProjectId, {
          boardId,
          columnKey,
          assigneeId,
        })
        .then((r) => r.tasks);
    });
  }

  @Post('projects/:projectId/tasks')
  @ApiOperation({ summary: 'Create a task in a project' })
  createTask(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreateTaskDto,
  ) {
    const userId = (user as CurrentUserClaims).sub;
    return this.projects.getProject(userId, projectId).then((p) => {
      const resolvedProjectId = getProjectId(p.project);
      return this.tasks
        .create(userId, resolvedProjectId, dto)
        .then((r) => r.task);
    });
  }

  @Get('tasks/:taskId')
  @ApiOperation({ summary: 'Get task by id' })
  getTask(@CurrentUser() user: any, @Param('taskId') taskId: string) {
    const userId = (user as CurrentUserClaims).sub;
    return this.tasks.get(userId, taskId).then(async (r) => {
      const projectId = getTaskProjectId(r.task);
      await this.projects.getProject(userId, projectId);
      return r.task;
    });
  }

  @Patch('tasks/:taskId')
  @ApiOperation({ summary: 'Update task' })
  updateTask(
    @CurrentUser() user: any,
    @Param('taskId') taskId: string,
    @Body() dto: UpdateTaskDto,
  ) {
    const userId = (user as CurrentUserClaims).sub;
    return this.tasks
      .get(userId, taskId)
      .then(async (r) => {
        const projectId = getTaskProjectId(r.task);
        await this.projects.getProject(userId, projectId);
        return this.tasks.update(userId, taskId, dto);
      })
      .then((r) => r.task);
  }

  @Post('tasks/:taskId/transition')
  @ApiOperation({ summary: 'Transition task between columns' })
  transition(
    @CurrentUser() user: any,
    @Param('taskId') taskId: string,
    @Body() dto: TransitionTaskDto,
  ) {
    const userId = (user as CurrentUserClaims).sub;
    return this.tasks
      .get(userId, taskId)
      .then(async (r) => {
        const projectId = getTaskProjectId(r.task);
        await this.projects.getProject(userId, projectId);
        return this.tasks.transition(userId, taskId, dto);
      })
      .then((r) => r.task);
  }

  @Delete('tasks/:taskId')
  @ApiOperation({ summary: 'Delete task' })
  deleteTask(@CurrentUser() user: any, @Param('taskId') taskId: string) {
    const userId = (user as CurrentUserClaims).sub;
    return this.tasks.get(userId, taskId).then(async (r) => {
      const projectId = getTaskProjectId(r.task);
      await this.projects.getProject(userId, projectId);
      return this.tasks.delete(userId, taskId);
    });
  }
}
