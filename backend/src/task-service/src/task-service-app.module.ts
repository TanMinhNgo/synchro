import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { TaskNatsController } from './modules/task/task.nats.controller';
import { TaskRepository } from './modules/task/task.repository';
import { TaskService } from './modules/task/task.service';
import { Task, TaskSchema } from './modules/task/schemas/task.schema';

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

    MongooseModule.forFeature([{ name: Task.name, schema: TaskSchema }]),
  ],
  controllers: [TaskNatsController],
  providers: [TaskRepository, TaskService],
})
export class TaskServiceAppModule {}
