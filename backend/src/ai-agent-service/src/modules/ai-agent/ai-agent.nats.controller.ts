import { Controller } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MessagePattern, Payload } from '@nestjs/microservices';
import type { AnalyzeTaskReportDto } from '@/contracts/ai-agent/dto/analyze-task-report.dto';
import type { AssignmentAdviceDto } from '@/contracts/ai-agent/dto/assignment-advice.dto';
import type { AssistantChatDto } from '@/contracts/ai-agent/dto/assistant-chat.dto';
import { aiAgentServiceSubjects } from '@/contracts/ai-agent/ai-agent.subjects';
import { AI_TASK_REPORT_SUBMITTED_EVENT } from './ai-agent.events';
import type { TaskReportSubmittedEvent } from './ai-agent.events';
import { AiAgentService } from './ai-agent.service';

@Controller()
export class AiAgentNatsController {
  constructor(
    private readonly ai: AiAgentService,
    private readonly events: EventEmitter2,
  ) {}

  @MessagePattern(aiAgentServiceSubjects.submitTaskReport)
  async submitTaskReport(
    @Payload()
    payload: { userId: string; taskId: string; dto: AnalyzeTaskReportDto },
  ) {
    const event: TaskReportSubmittedEvent = {
      actorUserId: payload.userId,
      taskId: payload.taskId,
      report: payload.dto,
    };

    const responses = await this.events.emitAsync(
      AI_TASK_REPORT_SUBMITTED_EVENT,
      event,
    );

    const first = responses.find((r) => Boolean(r));
    if (first) return first;

    return this.ai.analyzeTaskReport(payload.userId, payload.taskId, payload.dto);
  }

  @MessagePattern(aiAgentServiceSubjects.analyzeTaskReport)
  analyzeTaskReport(
    @Payload()
    payload: { userId: string; taskId: string; dto: AnalyzeTaskReportDto },
  ) {
    return this.ai.analyzeTaskReport(payload.userId, payload.taskId, payload.dto);
  }

  @MessagePattern(aiAgentServiceSubjects.getProjectReportSummary)
  getProjectReportSummary(
    @Payload() payload: { userId: string; projectId: string },
  ) {
    return this.ai.getProjectReportSummary(payload.userId, payload.projectId);
  }

  @MessagePattern(aiAgentServiceSubjects.getTaskReportHistory)
  getTaskReportHistory(
    @Payload()
    payload: {
      userId: string;
      taskId: string;
      options: {
        page?: number;
        pageSize?: number;
        verdict?: 'needs_fix' | 'review_manually' | 'reasonable';
        minScore?: number;
        maxScore?: number;
      };
    },
  ) {
    return this.ai.getTaskReportHistory(
      payload.userId,
      payload.taskId,
      payload.options,
    );
  }

  @MessagePattern(aiAgentServiceSubjects.getAssignmentAdvice)
  getAssignmentAdvice(
    @Payload()
    payload: { userId: string; projectId: string; dto: AssignmentAdviceDto },
  ) {
    return this.ai.getAssignmentAdvice(
      payload.userId,
      payload.projectId,
      payload.dto,
    );
  }

  @MessagePattern(aiAgentServiceSubjects.chatWithAssistant)
  chatWithAssistant(
    @Payload() payload: { userId: string; dto: AssistantChatDto },
  ) {
    return this.ai.chatWithAssistant(payload.userId, payload.dto);
  }
}
