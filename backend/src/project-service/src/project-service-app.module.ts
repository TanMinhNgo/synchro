import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { ProjectNatsController } from './modules/project/project.nats.controller';
import { ProjectRepository } from './modules/project/project.repository';
import { ProjectService } from './modules/project/project.service';
import { Board, BoardSchema } from './modules/project/schemas/board.schema';
import {
  ProjectColumn,
  ProjectColumnSchema,
} from './modules/project/schemas/column.schema';
import { Label, LabelSchema } from './modules/project/schemas/label.schema';
import {
  Project,
  ProjectSchema,
} from './modules/project/schemas/project.schema';

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
      { name: Project.name, schema: ProjectSchema },
      { name: Board.name, schema: BoardSchema },
      { name: ProjectColumn.name, schema: ProjectColumnSchema },
      { name: Label.name, schema: LabelSchema },
    ]),
  ],
  controllers: [ProjectNatsController],
  providers: [ProjectRepository, ProjectService],
})
export class ProjectServiceAppModule {}
