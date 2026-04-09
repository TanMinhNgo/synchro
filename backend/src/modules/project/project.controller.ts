import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
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
import { UserServiceClient } from '@/modules/auth/user-service.client';
import { CreateBoardDto } from '@/contracts/project/dto/create-board.dto';
import { CreateColumnDto } from '@/contracts/project/dto/create-column.dto';
import { CreateLabelDto } from '@/contracts/project/dto/create-label.dto';
import { CreateProjectDto } from '@/contracts/project/dto/create-project.dto';
import { UpdateColumnDto } from '@/contracts/project/dto/update-column.dto';
import { UpdateProjectDto } from '@/contracts/project/dto/update-project.dto';
import { ProjectServiceClient } from './project-service.client';

@Controller()
@ApiTags('projects')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private readonly projects: ProjectServiceClient,
    private readonly users: UserServiceClient,
  ) {}

  @Get('projects')
  @ApiOperation({ summary: 'List projects visible to current user' })
  @ApiOkResponse({ description: 'Projects list' })
  listProjects(@CurrentUser() user: any) {
    return this.projects
      .listProjects((user as CurrentUserClaims).sub)
      .then((r) => r.projects);
  }

  @Post('projects')
  @ApiOperation({ summary: 'Create a project' })
  @ApiOkResponse({ description: 'Created project' })
  createProject(@CurrentUser() user: any, @Body() dto: CreateProjectDto) {
    return this.projects
      .createProject((user as CurrentUserClaims).sub, dto)
      .then((r) => r.project);
  }

  @Get('projects/:projectId')
  @ApiOperation({ summary: 'Get a project' })
  getProject(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.projects
      .getProject((user as CurrentUserClaims).sub, projectId)
      .then((r) => r.project);
  }

  @Get('projects/:projectId/members')
  @ApiOperation({ summary: 'List project member profiles (owner + members)' })
  @ApiOkResponse({ description: 'Project member profiles' })
  async listProjectMembers(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    const res = await this.projects.getProject(
      (user as CurrentUserClaims).sub,
      projectId,
    );
    const project = res.project as { ownerId?: unknown; memberIds?: unknown };
    const ownerId = typeof project.ownerId === 'string' ? project.ownerId : '';
    const memberIds = Array.isArray(project.memberIds)
      ? project.memberIds.filter((id): id is string => typeof id === 'string')
      : [];

    const ids = Array.from(new Set([ownerId, ...memberIds])).filter(
      (id): id is string => typeof id === 'string' && id.length > 0,
    );

    const users = await Promise.all(ids.map((id) => this.users.findById(id)));
    return users
      .filter((u): u is NonNullable<typeof u> => Boolean(u))
      .map((u) => ({
        id: u.id,
        email: u.email,
        name: u.name,
        avatarUrl: u.avatarUrl,
      }));
  }

  @Patch('projects/:projectId')
  @ApiOperation({ summary: 'Update a project' })
  updateProject(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projects
      .updateProject((user as CurrentUserClaims).sub, projectId, dto)
      .then((r) => r.project);
  }

  @Post('projects/:projectId/invite')
  @ApiOperation({ summary: 'Invite a member to project by email (owner only)' })
  @ApiOkResponse({ description: 'Invitation applied (membership updated)' })
  async inviteMember(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() body: { email?: string },
  ) {
    const userId = (user as CurrentUserClaims).sub;
    const email = typeof body?.email === 'string' ? body.email.trim() : '';
    if (!email) throw new BadRequestException('Email is required');

    const res = await this.projects.getProject(userId, projectId);
    const project = res.project as { ownerId?: unknown; memberIds?: unknown };
    if (project.ownerId !== userId)
      throw new ForbiddenException('Only owner can invite');

    const target = await this.users.findByEmail(email);
    if (!target) throw new BadRequestException('User not found');

    const memberIdsRaw = project.memberIds;
    const memberIds = Array.isArray(memberIdsRaw)
      ? memberIdsRaw.filter((id): id is string => typeof id === 'string')
      : [];

    const nextMemberIds = Array.from(new Set([...memberIds, target.id]));

    await this.projects.updateProject(userId, projectId, {
      memberIds: nextMemberIds,
    });

    return { ok: true };
  }

  @Delete('projects/:projectId')
  @ApiOperation({ summary: 'Delete a project (owner only)' })
  deleteProject(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
  ) {
    return this.projects.deleteProject(
      (user as CurrentUserClaims).sub,
      projectId,
    );
  }

  @Get('projects/:projectId/boards')
  @ApiOperation({ summary: 'List project boards' })
  listBoards(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.projects
      .listBoards((user as CurrentUserClaims).sub, projectId)
      .then((r) => r.boards);
  }

  @Post('projects/:projectId/boards')
  @ApiOperation({ summary: 'Create board (also creates default columns)' })
  createBoard(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreateBoardDto,
  ) {
    return this.projects
      .createBoard((user as CurrentUserClaims).sub, projectId, dto)
      .then((r) => r.board);
  }

  @Get('projects/:projectId/boards/:boardId/columns')
  @ApiOperation({ summary: 'List board columns' })
  listColumns(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('boardId') boardId: string,
  ) {
    return this.projects
      .listColumns((user as CurrentUserClaims).sub, projectId, boardId)
      .then((r) => r.columns);
  }

  @Post('projects/:projectId/boards/:boardId/columns')
  @ApiOperation({ summary: 'Create a column on board' })
  createColumn(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('boardId') boardId: string,
    @Body() dto: CreateColumnDto,
  ) {
    return this.projects
      .createColumn((user as CurrentUserClaims).sub, projectId, boardId, dto)
      .then((r) => r.column);
  }

  @Patch('projects/:projectId/boards/:boardId/columns/:columnId')
  @ApiOperation({ summary: 'Update a board column' })
  updateColumn(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ) {
    return this.projects
      .updateColumn(
        (user as CurrentUserClaims).sub,
        projectId,
        boardId,
        columnId,
        dto,
      )
      .then((r) => r.column);
  }

  @Get('projects/:projectId/labels')
  @ApiOperation({ summary: 'List project labels' })
  listLabels(@CurrentUser() user: any, @Param('projectId') projectId: string) {
    return this.projects
      .listLabels((user as CurrentUserClaims).sub, projectId)
      .then((r) => r.labels);
  }

  @Post('projects/:projectId/labels')
  @ApiOperation({ summary: 'Create project label' })
  createLabel(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Body() dto: CreateLabelDto,
  ) {
    return this.projects
      .createLabel((user as CurrentUserClaims).sub, projectId, dto)
      .then((r) => r.label);
  }

  @Delete('projects/:projectId/labels/:labelId')
  @ApiOperation({ summary: 'Delete project label' })
  deleteLabel(
    @CurrentUser() user: any,
    @Param('projectId') projectId: string,
    @Param('labelId') labelId: string,
  ) {
    return this.projects.deleteLabel(
      (user as CurrentUserClaims).sub,
      projectId,
      labelId,
    );
  }
}
