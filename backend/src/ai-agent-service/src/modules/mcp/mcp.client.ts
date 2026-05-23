import { randomUUID } from 'crypto';
import type { JsonRpcRequest, JsonRpcResponse } from './mcp.types';

export class McpClient {
  constructor(
    private readonly name: string,
    private readonly url: string,
    private readonly token?: string,
  ) {}

  async request<T>(method: string, params?: unknown): Promise<T> {
    const payload: JsonRpcRequest = {
      jsonrpc: '2.0',
      id: randomUUID(),
      method,
      ...(params !== undefined ? { params } : {}),
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    const response = await fetch(this.url, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(
        `${this.name} MCP request failed: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as JsonRpcResponse<T>;

    if (data.error) {
      throw new Error(
        `${this.name} MCP error ${data.error.code}: ${data.error.message}`,
      );
    }

    if (data.result === undefined) {
      throw new Error(`${this.name} MCP response missing result`);
    }

    return data.result;
  }

  listTools() {
    return this.request<{ tools: unknown[] }>('tools/list');
  }

  callTool(name: string, args: Record<string, unknown>) {
    return this.request<unknown>('tools/call', {
      name,
      arguments: args,
    });
  }
}
