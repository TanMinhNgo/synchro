import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { SentryModule } from '@sentry/nestjs/setup';
import Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { APP_FILTER } from '@nestjs/core';
import { SentryGlobalFilter } from '@sentry/nestjs/setup';
import { AuthModule } from './modules/auth/auth.module';
import { ProjectModule } from './modules/project/project.module';
import { TaskModule } from './modules/task/task.module';
import { NotificationModule } from './modules/notification/notification.module';
import { GoalsModule } from './modules/goals/goals.module';
import { ChatModule } from './modules/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema: Joi.object({
        NODE_ENV: Joi.string()
          .valid('development', 'test', 'production')
          .default('development'),
        PORT: Joi.number().port().default(3000),
        MONGODB_URI: Joi.string()
          .pattern(/^mongodb(\+srv)?:\/\//)
          .required(),
        REDIS_URL: Joi.string().uri().optional(),
        NATS_URL: Joi.string().uri().optional(),

        // Upstash REST envs are optional and are NOT used by BullMQ.
        UPSTASH_REDIS_REST_URL: Joi.string().uri().optional(),
        UPSTASH_REDIS_REST_TOKEN: Joi.string().optional(),

        SENTRY_DSN: Joi.string().uri().optional(),
        SENTRY_ENVIRONMENT: Joi.string().optional(),
        SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).optional(),

        JWT_ACCESS_SECRET: Joi.string().required(),
        JWT_ACCESS_TTL: Joi.string().optional(),
        REFRESH_TOKEN_TTL_DAYS: Joi.number().min(1).max(365).optional(),
        REFRESH_COOKIE_NAME: Joi.string().optional(),
        CORS_ORIGIN: Joi.string().optional(),

        GOOGLE_CLIENT_ID: Joi.string().optional(),
        GOOGLE_CLIENT_SECRET: Joi.string().optional(),
        GOOGLE_CALLBACK_URL: Joi.string().uri().optional(),

        // Stream Chat (getstream.io)
        STREAM_API_KEY: Joi.string().optional(),
        STREAM_API_SECRET: Joi.string().optional(),
        STREAM_APP_ID: Joi.string().optional(),
      }),
    }),

    SentryModule.forRoot(),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    AuthModule,
    ProjectModule,
    TaskModule,
    NotificationModule,
    GoalsModule,
    ChatModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_FILTER,
      useClass: SentryGlobalFilter,
    },
  ],
})
export class AppModule {}
