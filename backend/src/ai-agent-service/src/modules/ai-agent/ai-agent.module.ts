import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { TaskServiceClient } from '@/modules/task/task-service.client';
import { TASK_SERVICE_NATS_CLIENT } from '@/modules/task/task-service.nats';
import { ProjectServiceClient } from '@/modules/project/project-service.client';
import { PROJECT_SERVICE_NATS_CLIENT } from '@/modules/project/project-service.nats';
import { NotificationServiceClient } from '@/modules/notification/notification-service.client';
import { NOTIFICATION_SERVICE_NATS_CLIENT } from '@/modules/notification/notification-service.nats';
import { AiAgentListener } from './ai-agent.listener.js';
import { AiAgentService } from './ai-agent.service.js';
import { AiAgentNatsController } from './ai-agent.nats.controller.js';
import { McpModule } from '../mcp/mcp.module';
import {
  TaskReportHistory,
  TaskReportHistorySchema,
} from './schemas/task-report-history.schema';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: TASK_SERVICE_NATS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [
              config.get<string>('NATS_URL') ?? 'nats://localhost:4222',
            ],
          },
        }),
      },
      {
        name: PROJECT_SERVICE_NATS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [
              config.get<string>('NATS_URL') ?? 'nats://localhost:4222',
            ],
          },
        }),
      },
      {
        name: NOTIFICATION_SERVICE_NATS_CLIENT,
        inject: [ConfigService],
        useFactory: (config: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [
              config.get<string>('NATS_URL') ?? 'nats://localhost:4222',
            ],
          },
        }),
      },
    ]),
    MongooseModule.forFeature([
      { name: TaskReportHistory.name, schema: TaskReportHistorySchema },
    ]),
    McpModule,
  ],
  controllers: [AiAgentNatsController],
  providers: [
    AiAgentService,
    AiAgentListener,
    TaskServiceClient,
    ProjectServiceClient,
    NotificationServiceClient,
  ],
})
export class AiAgentModule {}
