import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { NotificationNatsController } from './modules/notification/notification.nats.controller';
import { NotificationRepository } from './modules/notification/notification.repository';
import { NotificationService } from './modules/notification/notification.service';
import {
  Notification,
  NotificationSchema,
} from './modules/notification/schemas/notification.schema';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        MONGODB_URI: Joi.string()
          .pattern(/^mongodb(\+srv)?:\/\//)
          .required(),
        NATS_URL: Joi.string().uri().optional(),
      }),
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    MongooseModule.forFeature([
      { name: Notification.name, schema: NotificationSchema },
    ]),
  ],
  controllers: [NotificationNatsController],
  providers: [NotificationRepository, NotificationService],
})
export class NotificationServiceAppModule {}
