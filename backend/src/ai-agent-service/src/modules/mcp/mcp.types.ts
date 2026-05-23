export type JsonRpcRequest = {
  jsonrpc: '2.0';
  id: string;
  method: string;
  params?: unknown;
};

export type JsonRpcError = {
  code: number;
  message: string;
  data?: unknown;
};

export type JsonRpcResponse<T> = {
  jsonrpc: '2.0';
  id: string;
  result?: T;
  error?: JsonRpcError;
};
