export interface AiTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AiFunctionCall {
  name: string;
  args: Record<string, unknown>;
}

export interface AiResponse {
  functionCalls?: AiFunctionCall[];
  text?: string;
}

export interface ChatMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface AiService {
  generateContent(question: string, tools: AiTool[]): Promise<AiResponse>;

  generateChatContent(
    history: ChatMessage[],
    tools: AiTool[],
    systemInstruction?: string,
  ): Promise<AiResponse>;
}
