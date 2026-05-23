import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AiAgentController } from './ai-agent.controller';
import { AiAgentServiceClient } from './ai-agent-service.client';
import { AI_AGENT_SERVICE_NATS_CLIENT } from './ai-agent-service.nats';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
      {
        name: AI_AGENT_SERVICE_NATS_CLIENT,
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
  controllers: [AiAgentController],
  providers: [AiAgentServiceClient],
  exports: [AiAgentServiceClient],
})
export class AiAgentModule {}
