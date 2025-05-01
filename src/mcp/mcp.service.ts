import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeminiService } from '../gemini/gemini.service';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { LoggerService } from '../core/services/logger.service';
import {
  AiTool,
  AiFunctionCall,
  ChatMessage,
} from '../core/interfaces/ai-service.interface';
import {
  McpTool,
  McpToolResponse,
  McpToolResult,
  AiChatResponse,
} from './interfaces/mcp.interface';

@Injectable()
export class McpService {
  private readonly logger: LoggerService;
  private sessionStore: Record<string, ChatMessage[]> = {};

  constructor(
    private readonly geminiService: GeminiService,
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('McpService');
  }

  async askGemini(
    sessionId: string,
    message: string,
    systemInstruction?: string,
    history?: ChatMessage[],
  ): Promise<AiChatResponse> {
    try {
      if (history) {
        this.sessionStore[sessionId] = [...history];
      } else if (!this.sessionStore[sessionId]) {
        this.sessionStore[sessionId] = [];
      }

      this.sessionStore[sessionId].push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await this.geminiService.generateChatContent(
        this.sessionStore[sessionId],
        [],
        systemInstruction,
      );

      const resultText = response?.text || 'No response generated.';

      this.sessionStore[sessionId].push({
        role: 'model',
        parts: [{ text: resultText }],
      });

      return { answer: resultText };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in askGemini: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async askMcp(
    sessionId: string,
    message: string,
    systemInstruction?: string,
    history?: ChatMessage[],
  ): Promise<AiChatResponse> {
    const command = this.configService.get<string>('mcp.command', 'npx');
    const args = this.configService.get<string[]>('mcp.args', [
      'mcp-remote',
      'https://poc-docs-mcp-server.daohoangson.workers.dev/sse',
    ]);
    const timeout = this.configService.get<number>('mcp.timeout', 300000);

    const client = await this.createMcpClient(command, args, timeout);

    try {
      const mcpTools = await this.getMcpTools(client);

      if (history) {
        this.sessionStore[sessionId] = [...history];
      } else if (!this.sessionStore[sessionId]) {
        this.sessionStore[sessionId] = [];
      }

      this.sessionStore[sessionId].push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await this.geminiService.generateChatContent(
        this.sessionStore[sessionId],
        mcpTools,
        systemInstruction,
      );

      const resultText = await this.processGeminiResponse(client, response);

      this.sessionStore[sessionId].push({
        role: 'model',
        parts: [{ text: resultText }],
      });

      return { answer: resultText };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error in askMcp: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    } finally {
      await client.close();
    }
  }

  private async createMcpClient(
    command: string,
    args: string[],
    timeout: number,
  ): Promise<Client> {
    try {
      const serverParams = new StdioClientTransport({
        command,
        args,
      });

      const client = new Client({
        name: 'katalon-support-bot',
        version: '1.0.0',
        transport: serverParams,
        timeout,
      });

      await client.connect(serverParams);
      return client;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error creating MCP client: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async getMcpTools(client: Client): Promise<AiTool[]> {
    try {
      const mcpToolsResult = (await client.listTools()) as McpToolResponse;
      const mcpTools: McpTool[] = Array.isArray(mcpToolsResult.tools)
        ? mcpToolsResult.tools
        : [];

      return mcpTools.map((tool) => this.convertMcpToolToAiTool(tool));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error getting MCP tools: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private convertMcpToolToAiTool(tool: McpTool): AiTool {
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
  }

  private async processGeminiResponse(
    client: Client,
    response: {
      functionCalls?: AiFunctionCall[];
      text?: string;
    },
  ): Promise<string> {
    if (
      response &&
      Array.isArray(response.functionCalls) &&
      response.functionCalls.length > 0
    ) {
      const functionCall = response.functionCalls[0];
      if (functionCall && functionCall.name && functionCall.args) {
        return await this.callMcpTool(client, functionCall);
      }
    } else if (response?.text && typeof response.text === 'string') {
      return response.text;
    }

    return 'No function call found in the response.';
  }

  private async callMcpTool(
    client: Client,
    functionCall: AiFunctionCall,
  ): Promise<string> {
    try {
      const result = (await client.callTool({
        name: functionCall.name,
        arguments: functionCall.args,
      })) as McpToolResult;

      return result?.content?.[0]?.text &&
        typeof result.content[0].text === 'string'
        ? result.content[0].text
        : 'No result returned from MCP tool.';
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error calling MCP tool: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return `Error calling tool ${functionCall.name}: ${errorMessage}`;
    }
  }
}
