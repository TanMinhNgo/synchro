# AI Agent Service

This document explains how to run and use the AI agent in Synchro, including MCP setup for GitHub and Notion.

## Overview

- Gateway exposes AI endpoints under `api/ai-agent/*`.
- AI logic runs inside `ai-agent-service` as a NATS microservice.
- AI service can call MCP providers internally (GitHub + Notion).

## Run services

From `backend/`:

```bash
npm run start:dev:gateway
npm run start:dev:ai-agent-service
```

Or run all:

```bash
npm run start:dev:all
```

## Environment variables

Required:

- `MONGODB_URI`
- `NATS_URL`

AI providers:

- `AI_REVIEW_PROVIDER` = `none | openai | azure-openai`
- `OPENAI_API_KEY`, `OPENAI_MODEL`
- `AZURE_OPENAI_ENDPOINT`, `AZURE_OPENAI_API_KEY`, `AZURE_OPENAI_DEPLOYMENT`, `AZURE_OPENAI_API_VERSION`

MCP (internal only in ai-agent-service):

- `MCP_GITHUB_URL`
- `MCP_GITHUB_TOKEN`
- `MCP_NOTION_URL`
- `MCP_NOTION_TOKEN`

## API usage (via gateway)

Examples use `Authorization: Bearer <jwt>`.

- `POST /api/ai-agent/tasks/:taskId/submit-report`
- `POST /api/ai-agent/tasks/:taskId/analyze-report`
- `GET /api/ai-agent/projects/:projectId/report-summary`
- `GET /api/ai-agent/tasks/:taskId/report-history`
- `POST /api/ai-agent/projects/:projectId/assignment-advice`
- `POST /api/ai-agent/chat`

## MCP usage (internal)

Inject `McpService` inside `ai-agent-service` code.

```ts
import { McpService } from '../mcp/mcp.service';

constructor(private readonly mcp: McpService) {}

async listGithubTools() {
  return this.mcp.listTools('github');
}

async callNotionTool() {
  return this.mcp.callTool('notion', 'pages/search', {
    query: 'Synchro',
    page_size: 5,
  });
}
```

Notes:
- MCP clients use JSON-RPC 2.0 with `tools/list` and `tools/call` methods.
- Ensure MCP provider URLs point to the MCP server HTTP endpoint.
