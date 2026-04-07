import { BadGatewayException, Inject, Injectable, Logger } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import type { CreateBoardDto } from '@/contracts/project/dto/create-board.dto';
import type { CreateColumnDto } from '@/contracts/project/dto/create-column.dto';
import type { CreateLabelDto } from '@/contracts/project/dto/create-label.dto';
import type { CreateProjectDto } from '@/contracts/project/dto/create-project.dto';
import type { UpdateColumnDto } from '@/contracts/project/dto/update-column.dto';
import type { UpdateProjectDto } from '@/contracts/project/dto/update-project.dto';
import { projectServiceSubjects } from '@/contracts/project/project.subjects';
import {
  PROJECT_SERVICE_NATS_CLIENT,
} from './project-service.nats';

@Injectable()
export class ProjectServiceClient {
  private readonly logger = new Logger(ProjectServiceClient.name);

  constructor(
    @Inject(PROJECT_SERVICE_NATS_CLIENT) private readonly client: ClientProxy,
  ) {}

  private async send<Req, Res>(subject: string, payload: Req): Promise<Res> {
    try {
      return await firstValueFrom(
        this.client.send<Res, Req>(subject, payload).pipe(timeout(5000)),
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`NATS request failed subject=${subject} error=${msg}`);
      throw new BadGatewayException('project-service (NATS) request failed');
    }
  }

  listProjects(userId: string) {
    return this.send<{ userId: string }, { projects: unknown[] }>(
      projectServiceSubjects.listProjects,
      { userId },
    );
  }

  createProject(userId: string, dto: CreateProjectDto) {
    return this.send<
      { userId: string; dto: CreateProjectDto },
      { project: unknown }
    >(projectServiceSubjects.createProject, { userId, dto });
  }

  getProject(userId: string, projectId: string) {
    return this.send<
      { userId: string; projectId: string },
      { project: unknown }
    >(projectServiceSubjects.getProject, { userId, projectId });
  }

  updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    return this.send<
      { userId: string; projectId: string; dto: UpdateProjectDto },
      { project: unknown }
    >(projectServiceSubjects.updateProject, { userId, projectId, dto });
  }

  deleteProject(userId: string, projectId: string) {
    return this.send<{ userId: string; projectId: string }, { ok: boolean }>(
      projectServiceSubjects.deleteProject,
      { userId, projectId },
    );
  }

  listBoards(userId: string, projectId: string) {
    return this.send<
      { userId: string; projectId: string },
      { boards: unknown[] }
    >(projectServiceSubjects.listBoards, { userId, projectId });
  }

  createBoard(userId: string, projectId: string, dto: CreateBoardDto) {
    return this.send<
      { userId: string; projectId: string; dto: CreateBoardDto },
      { board: unknown }
    >(projectServiceSubjects.createBoard, { userId, projectId, dto });
  }

  listColumns(userId: string, projectId: string, boardId: string) {
    return this.send<
      { userId: string; projectId: string; boardId: string },
      { columns: unknown[] }
    >(projectServiceSubjects.listColumns, { userId, projectId, boardId });
  }

  createColumn(
    userId: string,
    projectId: string,
    boardId: string,
    dto: CreateColumnDto,
  ) {
    return this.send<
      {
        userId: string;
        projectId: string;
        boardId: string;
        dto: CreateColumnDto;
      },
      { column: unknown }
    >(projectServiceSubjects.createColumn, { userId, projectId, boardId, dto });
  }

  updateColumn(
    userId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    dto: UpdateColumnDto,
  ) {
    return this.send<
      {
        userId: string;
        projectId: string;
        boardId: string;
        columnId: string;
        dto: UpdateColumnDto;
      },
      { column: unknown }
    >(projectServiceSubjects.updateColumn, {
      userId,
      projectId,
      boardId,
      columnId,
      dto,
    });
  }

  listLabels(userId: string, projectId: string) {
    return this.send<
      { userId: string; projectId: string },
      { labels: unknown[] }
    >(projectServiceSubjects.listLabels, { userId, projectId });
  }

  createLabel(userId: string, projectId: string, dto: CreateLabelDto) {
    return this.send<
      { userId: string; projectId: string; dto: CreateLabelDto },
      { label: unknown }
    >(projectServiceSubjects.createLabel, { userId, projectId, dto });
  }

  deleteLabel(userId: string, projectId: string, labelId: string) {
    return this.send<
      { userId: string; projectId: string; labelId: string },
      { ok: boolean }
    >(projectServiceSubjects.deleteLabel, { userId, projectId, labelId });
  }
}
