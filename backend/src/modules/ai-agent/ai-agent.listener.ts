import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AI_TASK_REPORT_SUBMITTED_EVENT } from './ai-agent.events';
import type { TaskReportSubmittedEvent } from './ai-agent.events';
import { AiAgentService } from './ai-agent.service';

@Injectable()
export class AiAgentListener {
  constructor(private readonly ai: AiAgentService) {}

  @OnEvent(AI_TASK_REPORT_SUBMITTED_EVENT, { async: true })
  async onTaskReportSubmitted(event: TaskReportSubmittedEvent) {
    return this.ai.analyzeTaskReport(
      event.actorUserId,
      event.taskId,
      event.report,
    );
  }
}
