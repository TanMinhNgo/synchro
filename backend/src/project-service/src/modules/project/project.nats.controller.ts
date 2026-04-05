import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { CreateBoardDto } from '@/contracts/project/dto/create-board.dto';
import type { CreateColumnDto } from '@/contracts/project/dto/create-column.dto';
import type { CreateLabelDto } from '@/contracts/project/dto/create-label.dto';
import type { CreateProjectDto } from '@/contracts/project/dto/create-project.dto';
import type { UpdateColumnDto } from '@/contracts/project/dto/update-column.dto';
import type { UpdateProjectDto } from '@/contracts/project/dto/update-project.dto';
import { projectServiceSubjects } from '@/contracts/project/project.subjects';
import { ProjectService } from './project.service';

@Controller()
export class ProjectNatsController {
  constructor(private readonly projects: ProjectService) {}

  @MessagePattern(projectServiceSubjects.listProjects)
  async listProjects(@Payload() payload: { userId: string }) {
    const projects = await this.projects.listProjects(payload.userId);
    return { projects };
  }

  @MessagePattern(projectServiceSubjects.createProject)
  async createProject(
    @Payload() payload: { userId: string; dto: CreateProjectDto },
  ) {
    const project = await this.projects.createProject(
      payload.userId,
      payload.dto,
    );
    return { project };
  }

  @MessagePattern(projectServiceSubjects.getProject)
  async getProject(@Payload() payload: { userId: string; projectId: string }) {
    const project = await this.projects.getProject(
      payload.userId,
      payload.projectId,
    );
    return { project };
  }

  @MessagePattern(projectServiceSubjects.updateProject)
  async updateProject(
    @Payload()
    payload: {
      userId: string;
      projectId: string;
      dto: UpdateProjectDto;
    },
  ) {
    const project = await this.projects.updateProject(
      payload.userId,
      payload.projectId,
      payload.dto,
    );
    return { project };
  }

  @MessagePattern(projectServiceSubjects.deleteProject)
  async deleteProject(
    @Payload() payload: { userId: string; projectId: string },
  ) {
    return this.projects.deleteProject(payload.userId, payload.projectId);
  }

  @MessagePattern(projectServiceSubjects.listBoards)
  async listBoards(@Payload() payload: { userId: string; projectId: string }) {
    const boards = await this.projects.listBoards(
      payload.userId,
      payload.projectId,
    );
    return { boards };
  }

  @MessagePattern(projectServiceSubjects.createBoard)
  async createBoard(
    @Payload()
    payload: {
      userId: string;
      projectId: string;
      dto: CreateBoardDto;
    },
  ) {
    const board = await this.projects.createBoard(
      payload.userId,
      payload.projectId,
      payload.dto,
    );
    return { board };
  }

  @MessagePattern(projectServiceSubjects.listColumns)
  async listColumns(
    @Payload() payload: { userId: string; projectId: string; boardId: string },
  ) {
    const columns = await this.projects.listColumns(
      payload.userId,
      payload.projectId,
      payload.boardId,
    );
    return { columns };
  }

  @MessagePattern(projectServiceSubjects.createColumn)
  async createColumn(
    @Payload()
    payload: {
      userId: string;
      projectId: string;
      boardId: string;
      dto: CreateColumnDto;
    },
  ) {
    const column = await this.projects.createColumn(
      payload.userId,
      payload.projectId,
      payload.boardId,
      payload.dto,
    );
    return { column };
  }

  @MessagePattern(projectServiceSubjects.updateColumn)
  async updateColumn(
    @Payload()
    payload: {
      userId: string;
      projectId: string;
      boardId: string;
      columnId: string;
      dto: UpdateColumnDto;
    },
  ) {
    const column = await this.projects.updateColumn(
      payload.userId,
      payload.projectId,
      payload.boardId,
      payload.columnId,
      payload.dto,
    );
    return { column };
  }

  @MessagePattern(projectServiceSubjects.listLabels)
  async listLabels(@Payload() payload: { userId: string; projectId: string }) {
    const labels = await this.projects.listLabels(
      payload.userId,
      payload.projectId,
    );
    return { labels };
  }

  @MessagePattern(projectServiceSubjects.createLabel)
  async createLabel(
    @Payload()
    payload: {
      userId: string;
      projectId: string;
      dto: CreateLabelDto;
    },
  ) {
    const label = await this.projects.createLabel(
      payload.userId,
      payload.projectId,
      payload.dto,
    );
    return { label };
  }

  @MessagePattern(projectServiceSubjects.deleteLabel)
  async deleteLabel(
    @Payload() payload: { userId: string; projectId: string; labelId: string },
  ) {
    return this.projects.deleteLabel(
      payload.userId,
      payload.projectId,
      payload.labelId,
    );
  }
}
