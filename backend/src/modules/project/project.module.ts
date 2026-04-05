import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ProjectController } from './project.controller';
import { ProjectServiceClient } from './project-service.client';
import { PROJECT_SERVICE_NATS_CLIENT } from './project-service.nats';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
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
    ]),
  ],
  controllers: [ProjectController],
  providers: [ProjectServiceClient],
  exports: [ProjectServiceClient],
})
export class ProjectModule {}
