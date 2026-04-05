import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { NotificationController } from './notification.controller';
import { NotificationGateway } from './notification.gateway';
import { NotificationServiceClient } from './notification-service.client';
import { NOTIFICATION_SERVICE_NATS_CLIENT } from './notification-service.nats';
import { NotificationProxyService } from './notification.proxy.service';

@Module({
  imports: [
    ConfigModule,
    ClientsModule.registerAsync([
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
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      }),
    }),
  ],
  controllers: [NotificationController],
  providers: [
    NotificationServiceClient,
    NotificationProxyService,
    NotificationGateway,
  ],
})
export class NotificationModule {}
