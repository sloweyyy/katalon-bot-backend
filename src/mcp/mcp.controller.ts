import { Controller, Post, Body } from '@nestjs/common';
import { McpService } from './mcp.service';
import { AskMcpDto } from './dto/ask-mcp.dto';
import { AskGeminiDto } from './dto/ask-gemini.dto';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody 
} from '@nestjs/swagger';

@ApiTags('chat')
@Controller('mcp')
export class McpController {
  constructor(private readonly mcpService: McpService) {}

  @ApiOperation({ 
    summary: 'Send a message to Gemini API',
    description: 'Process a user message through the Gemini API and return a response',
  })
  @ApiBody({ type: AskGeminiDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Message processed successfully',
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          example: 'To set up a test case in Katalon Studio, you need to start by creating a new project...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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

  @ApiOperation({ 
    summary: 'Send a message to MCP',
    description: 'Process a user message through the Model Context Protocol to provide Katalon-specific responses',
  })
  @ApiBody({ type: AskMcpDto })
  @ApiResponse({ 
    status: 200, 
    description: 'Message processed successfully',
    schema: {
      type: 'object',
      properties: {
        answer: {
          type: 'string',
          example: 'In Katalon Studio, you can create a new test case by following these steps...',
        },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 500, description: 'Internal server error' })
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
