import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { NotificationModule } from '@/modules/notification/notification.module';
import { ProjectModule } from '@/modules/project/project.module';
import { TaskModule } from '@/modules/task/task.module';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentListener } from './ai-agent.listener';
import { AiAgentService } from './ai-agent.service';
import {
  TaskReportHistory,
  TaskReportHistorySchema,
} from './schemas/task-report-history.schema';

@Module({
  imports: [
    TaskModule,
    ProjectModule,
    NotificationModule,
    MongooseModule.forFeature([
      { name: TaskReportHistory.name, schema: TaskReportHistorySchema },
    ]),
  ],
  controllers: [AiAgentController],
  providers: [AiAgentService, AiAgentListener],
})
export class AiAgentModule {}
