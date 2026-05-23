import { BadGatewayException, Inject, Injectable } from '@nestjs/common';
import type { ClientProxy } from '@nestjs/microservices';
import { firstValueFrom, timeout } from 'rxjs';
import type { AnalyzeTaskReportDto } from '@/contracts/ai-agent/dto/analyze-task-report.dto';
import type { AssignmentAdviceDto } from '@/contracts/ai-agent/dto/assignment-advice.dto';
import type { AssistantChatDto } from '@/contracts/ai-agent/dto/assistant-chat.dto';
import { aiAgentServiceSubjects } from '@/contracts/ai-agent/ai-agent.subjects';
import { AI_AGENT_SERVICE_NATS_CLIENT } from './ai-agent-service.nats';

@Injectable()
export class AiAgentServiceClient {
  constructor(
    @Inject(AI_AGENT_SERVICE_NATS_CLIENT)
    private readonly client: ClientProxy,
  ) {}

  private async send<Req, Res>(subject: string, payload: Req): Promise<Res> {
    try {
      return await firstValueFrom(
        this.client.send<Res, Req>(subject, payload).pipe(timeout(15000)),
      );
    } catch {
      throw new BadGatewayException('ai-agent-service (NATS) request failed');
    }
  }

  submitTaskReport(userId: string, taskId: string, dto: AnalyzeTaskReportDto) {
    return this.send<
      { userId: string; taskId: string; dto: AnalyzeTaskReportDto },
      unknown
    >(aiAgentServiceSubjects.submitTaskReport, { userId, taskId, dto });
  }

  analyzeTaskReport(userId: string, taskId: string, dto: AnalyzeTaskReportDto) {
    return this.send<
      { userId: string; taskId: string; dto: AnalyzeTaskReportDto },
      unknown
    >(aiAgentServiceSubjects.analyzeTaskReport, { userId, taskId, dto });
  }

  getProjectReportSummary(userId: string, projectId: string) {
    return this.send<
      { userId: string; projectId: string },
      unknown
    >(aiAgentServiceSubjects.getProjectReportSummary, { userId, projectId });
  }

  getTaskReportHistory(
    userId: string,
    taskId: string,
    options: {
      page?: number;
      pageSize?: number;
      verdict?: 'needs_fix' | 'review_manually' | 'reasonable';
      minScore?: number;
      maxScore?: number;
    },
  ) {
    return this.send<
      {
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
      unknown
    >(aiAgentServiceSubjects.getTaskReportHistory, { userId, taskId, options });
  }

  getAssignmentAdvice(
    userId: string,
    projectId: string,
    dto: AssignmentAdviceDto,
  ) {
    return this.send<
      { userId: string; projectId: string; dto: AssignmentAdviceDto },
      unknown
    >(aiAgentServiceSubjects.getAssignmentAdvice, { userId, projectId, dto });
  }

  chatWithAssistant(userId: string, dto: AssistantChatDto) {
    return this.send<
      { userId: string; dto: AssistantChatDto },
      unknown
    >(aiAgentServiceSubjects.chatWithAssistant, { userId, dto });
  }
}
