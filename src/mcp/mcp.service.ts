import { Injectable } from '@nestjs/common';
import { GeminiService } from '../gemini/gemini.service';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

interface McpTool {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

interface McpToolResult {
  content?: Array<{ text?: string }>;
}

interface McpToolResponse {
  tools: McpTool[];
}

@Injectable()
export class McpService {
  constructor(private readonly geminiService: GeminiService) {}

  // In-memory session store
  private sessionStore: Record<
    string,
    Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>
  > = {};

  // Direct Gemini interaction without MCP
  async askGemini(
    sessionId: string,
    message: string,
    systemInstruction?: string,
    history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  ): Promise<{ answer: string }> {
    // Initialize or update session store with provided history
    if (history) {
      this.sessionStore[sessionId] = [...history];
    } else if (!this.sessionStore[sessionId]) {
      this.sessionStore[sessionId] = [];
    }

    // Add current message to history
    this.sessionStore[sessionId].push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Generate response using Gemini
    const response = await this.geminiService.generateChatContent(
      this.sessionStore[sessionId],
      [], // No tools for direct Gemini chat
      systemInstruction,
    );

    const resultText = response?.text || 'No response generated.';

    // Add model response to history
    this.sessionStore[sessionId].push({
      role: 'model',
      parts: [{ text: resultText }],
    });

    return { answer: resultText };
  }

  // MCP-based interaction with tools
  async askMcp(
    sessionId: string,
    message: string,
    systemInstruction?: string,
    history?: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
  ): Promise<{ answer: string }> {
    const serverParams = new StdioClientTransport({
      command: 'npx',
      args: [
        'mcp-remote',
        'https://poc-docs-mcp-server.daohoangson.workers.dev/sse',
      ],
    });

    const client = new Client({
      name: 'example-client',
      version: '1.0.0',
      transport: serverParams,
      timeout: 300000,
    });

    await client.connect(serverParams);
    const mcpToolsResult = (await client.listTools()) as McpToolResponse;
    const mcpTools: McpTool[] = Array.isArray(mcpToolsResult.tools)
      ? mcpToolsResult.tools
      : [];
    const tools = mcpTools.map((tool) => {
      const parameters = Object.fromEntries(
        Object.entries(tool.inputSchema).filter(
          ([key]) => !['additionalProperties', '$schema'].includes(key),
        ),
      );
      return {
        name: tool.name,
        description: tool.description,
        parameters,
      };
    });

    // Initialize or update session store with provided history
    if (history) {
      this.sessionStore[sessionId] = [...history];
    } else if (!this.sessionStore[sessionId]) {
      this.sessionStore[sessionId] = [];
    }

    // Add current message to history
    this.sessionStore[sessionId].push({
      role: 'user',
      parts: [{ text: message }],
    });

    const response = await this.geminiService.generateChatContent(
      this.sessionStore[sessionId],
      tools,
      systemInstruction,
    );

    let resultText = '';
    if (
      response &&
      Array.isArray(response.functionCalls) &&
      response.functionCalls.length > 0
    ) {
      const functionCall = response.functionCalls[0];
      if (functionCall && functionCall.name && functionCall.args) {
        const result = (await client.callTool({
          name: functionCall.name,
          arguments: functionCall.args,
        })) as McpToolResult;

        resultText =
          result?.content?.[0]?.text &&
          typeof result.content[0].text === 'string'
            ? result.content[0].text
            : 'No result returned from MCP tool.';
      }
    } else if (response?.text && typeof response.text === 'string') {
      resultText = response.text;
    } else {
      resultText = 'No function call found in the response.';
    }

    // Add model response to history
    this.sessionStore[sessionId].push({
      role: 'model',
      parts: [{ text: resultText }],
    });

    await client.close();
    return { answer: resultText };
  }
}
