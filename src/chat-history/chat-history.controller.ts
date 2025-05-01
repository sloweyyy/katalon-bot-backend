import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  Query,
  HttpStatus,
  HttpException,
  Logger,
} from '@nestjs/common';
import { ChatHistoryService } from './chat-history.service';
import { ChatSession } from '../core/interfaces/chat-history.interface';
import { GeminiService } from '../gemini/gemini.service';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
  CreateChatSessionDto,
  AddMessageDto,
  UpdateTitleDto,
  GenerateTitleDto,
} from './dto';

@ApiTags('chat-history')
@Controller('chat-history')
export class ChatHistoryController {
  private readonly logger = new Logger(ChatHistoryController.name);

  constructor(
    private readonly chatHistoryService: ChatHistoryService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('sessions')
  @ApiOperation({ summary: 'Get all chat sessions for a user' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns all chat sessions for a user',
  })
  async getChatSessions(
    @Query('userId') userId: string,
  ): Promise<ChatSession[]> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }
    return this.chatHistoryService.getAllChatSessionsWithDetails(userId);
  }

  @Get('sessions/:sessionId')
  @ApiOperation({ summary: 'Get a specific chat session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns a chat session',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat session not found',
  })
  async getChatSession(
    @Query('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<ChatSession> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    const session = await this.chatHistoryService.getChatSession(
      userId,
      sessionId,
    );

    if (!session) {
      throw new HttpException('Chat session not found', HttpStatus.NOT_FOUND);
    }

    return session;
  }

  @Post('sessions')
  @ApiOperation({ summary: 'Create a new chat session' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The chat session has been created',
  })
  async createChatSession(
    @Body() createDto: CreateChatSessionDto,
  ): Promise<ChatSession> {
    try {
      return await this.chatHistoryService.createChatSession(
        createDto.userId,
        createDto.sessionId,
        createDto.title,
        createDto.config,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to create chat session: ${errorMessage}`,
        errorStack,
      );
      throw new HttpException(
        'Failed to create chat session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('sessions/:sessionId/messages')
  @ApiOperation({ summary: 'Add a message to a chat session' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The message has been added',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat session not found',
  })
  async addMessage(
    @Param('sessionId') sessionId: string,
    @Body() addMessageDto: AddMessageDto,
  ): Promise<ChatSession> {
    try {
      return await this.chatHistoryService.addMessageToChatSession(
        addMessageDto.userId,
        sessionId,
        addMessageDto.message,
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === 'Chat session not found'
      ) {
        throw new HttpException('Chat session not found', HttpStatus.NOT_FOUND);
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to add message: ${errorMessage}`, errorStack);
      throw new HttpException(
        'Failed to add message',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('sessions/:sessionId/title')
  @ApiOperation({ summary: 'Update a chat session title' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The title has been updated',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat session not found',
  })
  async updateTitle(
    @Param('sessionId') sessionId: string,
    @Body() updateTitleDto: UpdateTitleDto,
  ): Promise<ChatSession> {
    try {
      return await this.chatHistoryService.updateChatSessionTitle(
        updateTitleDto.userId,
        sessionId,
        updateTitleDto.title,
      );
    } catch (error: unknown) {
      if (
        error instanceof Error &&
        error.message === 'Chat session not found'
      ) {
        throw new HttpException('Chat session not found', HttpStatus.NOT_FOUND);
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Failed to update title: ${errorMessage}`, errorStack);
      throw new HttpException(
        'Failed to update title',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Delete('sessions/:sessionId')
  @ApiOperation({ summary: 'Delete a chat session' })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'The chat session has been deleted',
  })
  async deleteChatSession(
    @Query('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ): Promise<void> {
    if (!userId) {
      throw new HttpException('User ID is required', HttpStatus.BAD_REQUEST);
    }

    try {
      await this.chatHistoryService.deleteChatSession(userId, sessionId);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(
        `Failed to delete chat session: ${errorMessage}`,
        errorStack,
      );
      throw new HttpException(
        'Failed to delete chat session',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('generate-title')
  @ApiOperation({
    summary: 'Generate a title for a chat session based on first message',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Returns the generated title',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', example: 'Katalon Test Case Creation' },
      },
    },
  })
  async generateTitle(
    @Body() generateTitleDto: GenerateTitleDto,
  ): Promise<{ title: string }> {
    try {
      const firstMessage = generateTitleDto.firstMessage;

      try {
        const response = await this.geminiService.generateChatContent(
          [
            {
              role: 'user',
              parts: [
                {
                  text: `Create a brief, informative title that summarizes the main topic or question in the following message. Keep it between 4-7 words. Respond ONLY with the title: "${firstMessage}"`,
                },
              ],
            },
          ],
          [],
          'You are a helpful AI assistant that creates concise, descriptive chat titles. Focus on the main subject/question. Use clear, descriptive language. Do not use quotes in your response.',
        );

        let title = '';

        if (response && response.text) {
          title = response.text.trim();
          title = title.replace(/^["'](.+)["']$/, '$1');

          if (title.length > 0) {
            title = title.charAt(0).toUpperCase() + title.slice(1);
          }

          await this.chatHistoryService.updateChatSessionTitle(
            generateTitleDto.userId,
            generateTitleDto.sessionId,
            title,
          );

          return { title };
        } else {
          this.logger.warn(
            'Invalid response structure from Gemini API, using fallback title',
          );
          return this.generateFallbackTitle(firstMessage);
        }
      } catch (apiError: unknown) {
        const errorMessage =
          apiError instanceof Error ? apiError.message : 'Unknown error';
        const errorStack =
          apiError instanceof Error ? apiError.stack : undefined;
        this.logger.error(
          `Error calling Gemini API: ${errorMessage}`,
          errorStack,
        );
        return this.generateFallbackTitle(firstMessage);
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : undefined;
      this.logger.error(`Error generating title: ${errorMessage}`, errorStack);
      return this.generateFallbackTitle(generateTitleDto.firstMessage);
    }
  }

  private generateFallbackTitle(message: string): { title: string } {
    let title = message.substring(0, 30);
    const punctuationIndex = title.search(/[.!?]/);
    if (punctuationIndex > 0) {
      title = title.substring(0, punctuationIndex);
    }

    if (title.length > 0) {
      title = title.charAt(0).toUpperCase() + title.slice(1);
    }

    if (title.length < message.length) {
      title += '...';
    }

    return { title };
  }
}
