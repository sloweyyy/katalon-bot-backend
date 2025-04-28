import { Controller, Post, Body } from '@nestjs/common';
import { McpService } from './mcp.service';
import { AskMcpDto } from './dto/ask-mcp.dto';
import { AskGeminiDto } from './dto/ask-gemini.dto';

@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @Post('ask/gemini')
  async askGemini(
    @Body() askGeminiDto: AskGeminiDto,
  ): Promise<{ answer: string }> {
    return this.mcpService.askGemini(
      askGeminiDto.sessionId,
      askGeminiDto.message,
      askGeminiDto.systemInstruction,
      askGeminiDto.history,
    );
  }

  @Post('ask/mcp')
  async askMcp(@Body() askMcpDto: AskMcpDto): Promise<{ answer: string }> {
    return this.mcpService.askMcp(
      askMcpDto.sessionId,
      askMcpDto.message,
      askMcpDto.systemInstruction,
      askMcpDto.history,
    );
  }
}
