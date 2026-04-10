import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProjectModule } from '@/modules/project/project.module';
import { TaskController } from './task.controller';
import { TaskServiceClient } from './task-service.client';
import { TASK_SERVICE_NATS_CLIENT } from './task-service.nats';

@Module({
  imports: [
    ConfigModule,
    ProjectModule,
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
    ]),
  ],
  controllers: [TaskController],
  providers: [TaskServiceClient],
  exports: [TaskServiceClient],
})
export class TaskModule {}
