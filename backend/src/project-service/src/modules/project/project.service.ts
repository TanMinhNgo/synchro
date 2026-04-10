import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { isValidObjectId } from 'mongoose';
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

  private getIdValue(obj: unknown): string {
    if (!obj || typeof obj !== 'object') throw new Error('Invalid payload');
    const raw =
      (obj as { id?: unknown; _id?: unknown }).id ??
      (obj as { id?: unknown; _id?: unknown })._id;
    if (typeof raw === 'string' && raw) return raw;
    if (raw && typeof raw === 'object' && 'toString' in raw) {
      const v = (raw as { toString: () => string }).toString();
      if (v) return v;
    }
    throw new Error('Invalid payload');
  }

  private slugify(input: string): string {
    const base = (input ?? '')
      .trim()
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '')
      .replace(/-+/g, '-');
    return base || 'project';
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    const base = this.slugify(name);
    for (let i = 0; i < 50; i++) {
      const candidate = i === 0 ? base : `${base}-${i + 1}`;
      const exists = await this.repo.findProjectBySlug(candidate);
      if (!exists) return candidate;
    }
    throw new BadRequestException('Unable to generate project slug');
  }

  private async ensureProjectHasSlug(project: any, projectId: string) {
    if (project?.slug) return project;
    if (!project?.name) return project;
    const slug = await this.generateUniqueSlug(String(project.name));
    const updated = await this.repo.setProjectSlugById(projectId, slug);
    return updated ?? project;
  }

  private async getProjectByIdOrSlug(userId: string, idOrSlug: string) {
    const project = isValidObjectId(idOrSlug)
      ? await this.repo.findProjectById(idOrSlug)
      : await this.repo.findProjectBySlug(idOrSlug);

    if (!project) throw new NotFoundException('Project not found');
    this.assertAccess(project, userId);

    const projectId = isValidObjectId(idOrSlug)
      ? idOrSlug
      : this.getIdValue(project);
    const ensured = await this.ensureProjectHasSlug(project, projectId);
    return { project: ensured, projectId };
  }

  async listProjects(userId: string) {
    const projects = await this.repo.findProjectsForUser(userId);
    const out: any[] = [];
    for (const p of projects) {
      const id = this.getIdValue(p);
      out.push(await this.ensureProjectHasSlug(p as any, id));
    }
    return out;
  }

  async createProject(userId: string, dto: CreateProjectDto) {
    const slug = await this.generateUniqueSlug(dto.name);
    const project = await this.repo.createProject({
      ownerId: userId,
      name: dto.name,
      description: dto.description,
      slug,
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
    const { project } = await this.getProjectByIdOrSlug(userId, projectId);
    return project;
  }

  async updateProject(
    userId: string,
    projectId: string,
    dto: UpdateProjectDto,
  ) {
    const { project: existing, projectId: resolvedProjectId } =
      await this.getProjectByIdOrSlug(userId, projectId);

    if (dto.memberIds !== undefined && existing.ownerId !== userId) {
      throw new ForbiddenException('Only owner can update members');
    }

    const updated = await this.repo.updateProject(resolvedProjectId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.description !== undefined
        ? { description: dto.description }
        : {}),
      ...(dto.memberIds !== undefined ? { memberIds: dto.memberIds } : {}),
      ...(dto.status !== undefined ? { status: dto.status } : {}),
    });
    if (!updated) throw new NotFoundException('Project not found');
    return this.ensureProjectHasSlug(updated as any, resolvedProjectId);
  }

  async deleteProject(userId: string, projectId: string) {
    const { project: existing, projectId: resolvedProjectId } =
      await this.getProjectByIdOrSlug(userId, projectId);
    if (existing.ownerId !== userId)
      throw new ForbiddenException('Only owner can delete');
    const deleted = await this.repo.deleteProject(resolvedProjectId);
    return { ok: Boolean(deleted) };
  }

  async listBoards(userId: string, projectId: string) {
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    return this.repo.findBoardsByProjectId(resolvedProjectId);
  }

  async createBoard(userId: string, projectId: string, dto: CreateBoardDto) {
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    const board = await this.repo.createBoard({
      projectId: resolvedProjectId,
      name: dto.name,
      description: dto.description,
    });

    const defaults: Array<{
      key: ProjectColumnKey;
      name: string;
      order: number;
    }> = [
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
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    const board = await this.repo.findBoardById(boardId);
    if (!board || board.projectId !== resolvedProjectId)
      throw new NotFoundException('Board not found');
    return this.repo.findColumnsByBoardId(boardId);
  }

  async createColumn(
    userId: string,
    projectId: string,
    boardId: string,
    dto: CreateColumnDto,
  ) {
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    const board = await this.repo.findBoardById(boardId);
    if (!board || board.projectId !== resolvedProjectId)
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
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    const board = await this.repo.findBoardById(boardId);
    if (!board || board.projectId !== resolvedProjectId)
      throw new NotFoundException('Board not found');

    const updated = await this.repo.updateColumn(columnId, {
      ...(dto.name !== undefined ? { name: dto.name } : {}),
      ...(dto.order !== undefined ? { order: dto.order } : {}),
    });
    if (!updated) throw new NotFoundException('Column not found');
    return updated;
  }

  async listLabels(userId: string, projectId: string) {
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    return this.repo.findLabelsByProjectId(resolvedProjectId);
  }

  async createLabel(userId: string, projectId: string, dto: CreateLabelDto) {
    const { projectId: resolvedProjectId } = await this.getProjectByIdOrSlug(
      userId,
      projectId,
    );
    try {
      const label = await this.repo.createLabel({
        projectId: resolvedProjectId,
        name: dto.name,
        color: dto.color,
      });
      return label.toObject();
    } catch {
      throw new BadRequestException('Label name already exists in project');
    }
  }

  async deleteLabel(userId: string, projectId: string, labelId: string) {
    await this.getProjectByIdOrSlug(userId, projectId);
    const deleted = await this.repo.deleteLabel(labelId);
    if (!deleted) throw new NotFoundException('Label not found');
    return { ok: true };
  }
}
