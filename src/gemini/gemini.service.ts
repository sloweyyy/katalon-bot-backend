import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

interface GeminiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

interface GeminiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

interface GeminiResponse {
  functionCalls?: GeminiFunctionCall[];
  text?: string;
}

@Injectable()
export class GeminiService {
  private readonly ai: GoogleGenAI;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateContent(
    question: string,
    tools: GeminiTool[],
  ): Promise<GeminiResponse> {
    return (await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: question,
      config: {
        maxOutputTokens: 4096,
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        tools: [
          {
            functionDeclarations: tools,
          },
        ],
      },
    })) as GeminiResponse;
  }

  /**
   * Multi-turn chat with system instructions and long context.
   * @param history Array of chat messages (role: 'user' | 'model', parts: [{ text: string }])
   * @param tools GeminiTool[]
   * @param systemInstruction Optional system instruction for the model
   */
  async generateChatContent(
    history: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }>,
    tools: GeminiTool[],
    systemInstruction?: string,
  ): Promise<GeminiResponse> {
    interface GeminiConfig {
      maxOutputTokens: number;
      temperature: number;
      topK: number;
      topP: number;
      systemInstruction: string;
      tools?: Array<{
        functionDeclarations: GeminiTool[];
      }>;
    }

    const config: GeminiConfig = {
      maxOutputTokens: 4096,
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      systemInstruction:
        systemInstruction ||
        'You are a helpful customer support agent. Always be polite and concise.',
    };

    // Only add tools configuration if there are tools
    if (tools && tools.length > 0) {
      config.tools = [
        {
          functionDeclarations: tools,
        },
      ];
    }

    return (await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: history,
      config,
    })) as GeminiResponse;
  }
}
