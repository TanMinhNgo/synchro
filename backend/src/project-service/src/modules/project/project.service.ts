import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { CreateBoardDto } from '@/contracts/project/dto/create-board.dto';
import type { CreateColumnDto } from '@/contracts/project/dto/create-column.dto';
import type { CreateLabelDto } from '@/contracts/project/dto/create-label.dto';
import type { CreateProjectDto } from '@/contracts/project/dto/create-project.dto';
import type { UpdateColumnDto } from '@/contracts/project/dto/update-column.dto';
import type { UpdateProjectDto } from '@/contracts/project/dto/update-project.dto';
import { ProjectColumnKey } from '@/contracts/project/project.enums';
import { ProjectRepository } from './project.repository';

@Injectable()
export class ProjectService {
  constructor(private readonly repo: ProjectRepository) {}

  async listProjects(userId: string) {
    return this.repo.findProjectsForUser(userId);
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const project = await this.repo.createProject({
      ownerId: userId,
      name: dto.name,
      description: dto.description,
      memberIds: dto.memberIds ?? [],
    });
    return project.toObject();
  }

  private assertAccess(project: any, userId: string) {
    const isOwner = project.ownerId === userId;
    const isMember =
      Array.isArray(project.memberIds) && project.memberIds.includes(userId);
    if (!isOwner && !isMember) {
      throw new ForbiddenException('No access to project');
    }
  }

  async getProject(userId: string, projectId: string) {
    const project = await this.repo.findProjectById(projectId);
    if (!project) throw new NotFoundException('Project not found');
    this.assertAccess(project, userId);
    return project;
  }

  async updateProject(userId: string, projectId: string, dto: UpdateProjectDto) {
    const existing = await this.repo.findProjectById(projectId);
    if (!existing) throw new NotFoundException('Project not found');
    this.assertAccess(existing, userId);

    const updated = await this.repo.updateProject(projectId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined ? { description: dto.description } : {}),
      ...(dto.memberIds !== undefined ? { memberIds: dto.memberIds } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });
    if (!updated) throw new NotFoundException('Project not found');
    return updated;
  }

  async deleteProject(userId: string, projectId: string) {
    const existing = await this.repo.findProjectById(projectId);
    if (!existing) throw new NotFoundException('Project not found');
    if (existing.ownerId !== userId)
      throw new ForbiddenException('Only owner can delete');
    const deleted = await this.repo.deleteProject(projectId);
    return { ok: Boolean(deleted) };
  }

  async listBoards(userId: string, projectId: string) {
    await this.getProject(userId, projectId);
    return this.repo.findBoardsByProjectId(projectId);
  }

  async createBoard(userId: string, projectId: string, dto: CreateBoardDto) {
    await this.getProject(userId, projectId);
    const board = await this.repo.createBoard({
      projectId,
      name: dto.name,
      description: dto.description,
    });

    const defaults: Array<{ key: ProjectColumnKey; name: string; order: number }> = [
      { key: ProjectColumnKey.backlog, name: 'Backlog', order: 0 },
      { key: ProjectColumnKey.in_progress, name: 'In Progress', order: 1 },
      { key: ProjectColumnKey.in_review, name: 'In Review', order: 2 },
      { key: ProjectColumnKey.done, name: 'Done', order: 3 },
    ];

    await Promise.all(
      defaults.map((c) =>
        this.repo.createColumn({
          boardId: board.id,
          key: c.key,
          name: c.name,
          order: c.order,
        }),
      ),
    );

    return board.toObject();
  }

  async listColumns(userId: string, projectId: string, boardId: string) {
    await this.getProject(userId, projectId);
    const board = await this.repo.findBoardById(boardId);
    if (!board || board.projectId !== projectId)
      throw new NotFoundException('Board not found');
    return this.repo.findColumnsByBoardId(boardId);
  }

  async createColumn(
    userId: string,
    projectId: string,
    boardId: string,
    dto: CreateColumnDto,
  ) {
    await this.getProject(userId, projectId);
    const board = await this.repo.findBoardById(boardId);
    if (!board || board.projectId !== projectId)
      throw new NotFoundException('Board not found');

    const existing = await this.repo.findColumnsByBoardId(boardId);
    const order = dto.order ?? existing.length;

    try {
      const column = await this.repo.createColumn({
        boardId,
        key: dto.key,
        name: dto.name,
        order,
      });
      return column.toObject();
    } catch {
      throw new BadRequestException('Column key already exists on this board');
    }
  }

  async updateColumn(
    userId: string,
    projectId: string,
    boardId: string,
    columnId: string,
    dto: UpdateColumnDto,
  ) {
    await this.getProject(userId, projectId);
    const board = await this.repo.findBoardById(boardId);
    if (!board || board.projectId !== projectId)
      throw new NotFoundException('Board not found');

    const updated = await this.repo.updateColumn(columnId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
    });
    if (!updated) throw new NotFoundException('Column not found');
    return updated;
  }

  async listLabels(userId: string, projectId: string) {
    await this.getProject(userId, projectId);
    return this.repo.findLabelsByProjectId(projectId);
  }

  async createLabel(userId: string, projectId: string, dto: CreateLabelDto) {
    await this.getProject(userId, projectId);
    try {
      const label = await this.repo.createLabel({
        projectId,
        name: dto.name,
        color: dto.color,
      });
      return label.toObject();
    } catch {
      throw new BadRequestException('Label name already exists in project');
    }
  }

  async deleteLabel(userId: string, projectId: string, labelId: string) {
    await this.getProject(userId, projectId);
    const deleted = await this.repo.deleteLabel(labelId);
    if (!deleted) throw new NotFoundException('Label not found');
    return { ok: true };
  }
}
