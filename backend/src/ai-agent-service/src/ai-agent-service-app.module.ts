import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import Joi from 'joi';
import { AiAgentModule } from './modules/ai-agent/ai-agent.module';
import { McpModule } from './modules/mcp/mcp.module';

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

        AI_REVIEW_PROVIDER: Joi.string()
          .valid('none', 'openai', 'azure-openai')
          .optional(),
        OPENAI_API_KEY: Joi.string().optional(),
        OPENAI_MODEL: Joi.string().optional(),
        AZURE_OPENAI_ENDPOINT: Joi.string().uri().optional(),
        AZURE_OPENAI_API_KEY: Joi.string().optional(),
        AZURE_OPENAI_DEPLOYMENT: Joi.string().optional(),
        AZURE_OPENAI_API_VERSION: Joi.string().optional(),

        MCP_GITHUB_URL: Joi.string().uri().optional(),
        MCP_GITHUB_TOKEN: Joi.string().optional(),
        MCP_NOTION_URL: Joi.string().uri().optional(),
        MCP_NOTION_TOKEN: Joi.string().optional(),
      }),
    }),

    EventEmitterModule.forRoot(),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.getOrThrow<string>('MONGODB_URI'),
      }),
    }),

    AiAgentModule,
    McpModule,
  ],
})
export class AiAgentServiceAppModule {}
