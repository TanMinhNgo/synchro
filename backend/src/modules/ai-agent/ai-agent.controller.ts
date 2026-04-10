import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import type { CurrentUserClaims } from '@/common/decorators/current-user.decorator';
import { AnalyzeTaskReportDto } from '@/contracts/ai-agent/dto/analyze-task-report.dto';
import { AssignmentAdviceDto } from '@/contracts/ai-agent/dto/assignment-advice.dto';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { AI_TASK_REPORT_SUBMITTED_EVENT } from './ai-agent.events';
import type { TaskReportSubmittedEvent } from './ai-agent.events';
import { AiAgentService } from './ai-agent.service';

type HistoryVerdictFilter = 'needs_fix' | 'review_manually' | 'reasonable';

@Controller('ai-agent')
@ApiTags('ai-agent')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class AiAgentController {
  constructor(
    private readonly ai: AiAgentService,
    private readonly events: EventEmitter2,
  ) {}

  @Post('tasks/:taskId/submit-report')
  @ApiOperation({
    summary:
      'Submit assignee report and trigger automatic AI review via event pipeline',
  })
  @ApiOkResponse({ description: 'AI review result from event-driven flow' })
  async submitTaskReport(
    @CurrentUser() user: CurrentUserClaims,
    @Param('taskId') taskId: string,
    @Body() dto: AnalyzeTaskReportDto,
  ) {
    const payload: TaskReportSubmittedEvent = {
      actorUserId: user.sub,
      taskId,
      report: dto,
    };

    const responses = await this.events.emitAsync(
      AI_TASK_REPORT_SUBMITTED_EVENT,
      payload,
    );

    const first = responses.find((r) => Boolean(r));
    if (first) return first;

    return this.ai.analyzeTaskReport(user.sub, taskId, dto);
  }

  @Post('tasks/:taskId/analyze-report')
  @ApiOperation({
    summary:
      'Analyze a task report, detect inconsistencies, and notify users in inbox',
  })
  @ApiOkResponse({ description: 'AI report review result' })
  analyzeTaskReport(
    @CurrentUser() user: CurrentUserClaims,
    @Param('taskId') taskId: string,
    @Body() dto: AnalyzeTaskReportDto,
  ) {
    return this.ai.analyzeTaskReport(user.sub, taskId, dto);
  }

  @Get('projects/:projectId/report-summary')
  @ApiOperation({
    summary: 'Generate aggregated project report summary from all tasks',
  })
  @ApiOkResponse({ description: 'Project AI summary' })
  getProjectReportSummary(
    @CurrentUser() user: CurrentUserClaims,
    @Param('projectId') projectId: string,
  ) {
    return this.ai.getProjectReportSummary(user.sub, projectId);
  }

  @Get('tasks/:taskId/report-history')
  @ApiOperation({ summary: 'Get AI review history for a task (audit trail)' })
  @ApiOkResponse({ description: 'Task report history list' })
  getTaskReportHistory(
    @CurrentUser() user: CurrentUserClaims,
    @Param('taskId') taskId: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
    @Query('verdict') verdict?: string,
    @Query('minScore') minScore?: string,
    @Query('maxScore') maxScore?: string,
  ) {
    const parsedVerdict =
      verdict === 'needs_fix' ||
      verdict === 'review_manually' ||
      verdict === 'reasonable'
        ? (verdict as HistoryVerdictFilter)
        : undefined;

    return this.ai.getTaskReportHistory(user.sub, taskId, {
      page: page ? Number(page) : undefined,
      pageSize: pageSize ? Number(pageSize) : undefined,
      verdict: parsedVerdict,
      minScore: minScore ? Number(minScore) : undefined,
      maxScore: maxScore ? Number(maxScore) : undefined,
    });
  }

  @Post('projects/:projectId/assignment-advice')
  @ApiOperation({
    summary: 'Recommend assignee and schedule for a new task draft',
  })
  @ApiOkResponse({ description: 'Assignee and timeline recommendation' })
  getAssignmentAdvice(
    @CurrentUser() user: CurrentUserClaims,
    @Param('projectId') projectId: string,
    @Body() dto: AssignmentAdviceDto,
  ) {
    return this.ai.getAssignmentAdvice(user.sub, projectId, dto);
  }
}
