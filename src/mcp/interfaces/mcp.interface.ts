export interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpToolResult {
  content?: Array<{ text?: string }>;
}

export interface McpToolResponse {
  tools: McpTool[];
}

export interface AiChatResponse {
  answer: string;
}
