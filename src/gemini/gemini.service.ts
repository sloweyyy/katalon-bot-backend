import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';
import { LoggerService } from '../core/services/logger.service';
import {
  AiService,
  AiTool,
  AiResponse,
  ChatMessage,
} from '../core/interfaces/ai-service.interface';

@Injectable()
export class GeminiService implements AiService {
  private readonly ai: GoogleGenAI;
  private readonly logger: LoggerService;

  constructor(
    private readonly configService: ConfigService,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('GeminiService');

    const apiKey = this.configService.get<string>('gemini.apiKey');
    if (!apiKey) {
      this.logger.error('GEMINI_API_KEY environment variable is required');
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(
    question: string,
    tools: AiTool[],
  ): Promise<AiResponse> {
    try {
      const modelName = this.configService.get<string>(
        'gemini.model',
        'gemini-2.0-flash',
      );
      const maxTokens = this.configService.get<number>(
        'gemini.maxTokens',
        4096,
      );
      const temperature = this.configService.get<number>(
        'gemini.temperature',
        0.7,
      );
      const topK = this.configService.get<number>('gemini.topK', 40);
      const topP = this.configService.get<number>('gemini.topP', 0.95);

      return (await this.ai.models.generateContent({
        model: modelName,
        contents: question,
        config: {
          maxOutputTokens: maxTokens,
          temperature,
          topK,
          topP,
          tools:
            tools.length > 0 ? [{ functionDeclarations: tools }] : undefined,
        },
      })) as AiResponse;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating content: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }

  /**
   * Multi-turn chat with system instructions and long context.
   * @param history Array of chat messages
   * @param tools Array of AI tools
   * @param systemInstruction Optional system instruction for the model
   */
  async generateChatContent(
    history: ChatMessage[],
    tools: AiTool[],
    systemInstruction?: string,
  ): Promise<AiResponse> {
    try {
      const modelName = this.configService.get<string>(
        'gemini.model',
        'gemini-2.0-flash',
      );
      const maxTokens = this.configService.get<number>(
        'gemini.maxTokens',
        4096,
      );
      const temperature = this.configService.get<number>(
        'gemini.temperature',
        0.7,
      );
      const topK = this.configService.get<number>('gemini.topK', 40);
      const topP = this.configService.get<number>('gemini.topP', 0.95);
      const defaultSystemInstruction = this.configService.get<string>(
        'gemini.defaultSystemInstruction',
        'You are a helpful customer support agent. Always be polite and concise.',
      );

      const config = {
        maxOutputTokens: maxTokens,
        temperature,
        topK,
        topP,
        systemInstruction: systemInstruction || defaultSystemInstruction,
      };

      if (tools && tools.length > 0) {
        Object.assign(config, {
          tools: [{ functionDeclarations: tools }],
        });
      }

      return (await this.ai.models.generateContent({
        model: modelName,
        contents: history,
        config,
      })) as AiResponse;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Error generating chat content: ${errorMessage}`,
        errorStack,
      );
      throw error;
    }
  }
}
