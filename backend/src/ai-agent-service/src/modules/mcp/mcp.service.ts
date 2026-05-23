import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { McpClient } from './mcp.client';

export type McpProvider = 'github' | 'notion';

@Injectable()
export class McpService {
  private readonly clients = new Map<McpProvider, McpClient>();

  constructor(private readonly config: ConfigService) {
    const githubUrl = this.config.get<string>('MCP_GITHUB_URL');
    const githubToken = this.config.get<string>('MCP_GITHUB_TOKEN');
    if (githubUrl) {
      this.clients.set('github', new McpClient('github', githubUrl, githubToken));
    }

    const notionUrl = this.config.get<string>('MCP_NOTION_URL');
    const notionToken = this.config.get<string>('MCP_NOTION_TOKEN');
    if (notionUrl) {
      this.clients.set('notion', new McpClient('notion', notionUrl, notionToken));
    }
  }

  getClient(provider: McpProvider) {
    const client = this.clients.get(provider);
    if (!client) {
      throw new BadRequestException(`MCP provider not configured: ${provider}`);
    }
    return client;
  }

  listTools(provider: McpProvider) {
    return this.getClient(provider).listTools();
  }

  callTool(provider: McpProvider, name: string, args: Record<string, unknown>) {
    return this.getClient(provider).callTool(name, args);
  }
}
