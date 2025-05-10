import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from '@nestjs/cache-manager';
import { LoggerService } from '../core/services/logger.service';
import {
  ChatSession,
  Message,
  ChatConfig,
} from '../core/interfaces/chat-history.interface';

@Injectable()
export class ChatHistoryService {
  private readonly logger: LoggerService;

  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    logger: LoggerService,
  ) {
    this.logger = logger;
    this.logger.setContext('ChatHistoryService');
  }

  private getChatKey(userId: string): string {
    return `user:${userId}:chats`;
  }

  private getChatSessionKey(userId: string, sessionId: string): string {
    return `user:${userId}:chat:${sessionId}`;
  }

  async getAllChatSessions(userId: string): Promise<string[]> {
    try {
      const result = await this.cacheManager.get(this.getChatKey(userId));
      return (result as string[]) || [];
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error getting all chat sessions: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return [];
    }
  }

  async getChatSession(
    userId: string,
    sessionId: string,
  ): Promise<ChatSession | null> {
    try {
      const result = await this.cacheManager.get(
        this.getChatSessionKey(userId, sessionId),
      );
      return (result as ChatSession) || null;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error getting chat session: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }

  async createChatSession(
    userId: string,
    sessionId: string,
    title: string,
    config: ChatConfig,
  ): Promise<ChatSession> {
    try {
      const chatSession: ChatSession = {
        id: sessionId,
        title,
        messages: [],
        config,
        created: Date.now(),
        updated: Date.now(),
      };

      await this.cacheManager.set(
        this.getChatSessionKey(userId, sessionId),
        chatSession,
      );

      const chatSessions = await this.getAllChatSessions(userId);
      if (!chatSessions.includes(sessionId)) {
        chatSessions.push(sessionId);
        await this.cacheManager.set(this.getChatKey(userId), chatSessions);
      }

      return chatSession;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error creating chat session: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async addMessageToChatSession(
    userId: string,
    sessionId: string,
    message: Message,
  ): Promise<ChatSession> {
    try {
      const chatSession = await this.getChatSession(userId, sessionId);

      if (!chatSession) {
        throw new Error('Chat session not found');
      }

      chatSession.messages.push(message);
      chatSession.updated = Date.now();

      await this.cacheManager.set(
        this.getChatSessionKey(userId, sessionId),
        chatSession,
      );

      return chatSession;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error adding message to chat session: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async updateChatSessionTitle(
    userId: string,
    sessionId: string,
    title: string,
  ): Promise<ChatSession> {
    try {
      const chatSession = await this.getChatSession(userId, sessionId);

      if (!chatSession) {
        throw new Error('Chat session not found');
      }

      chatSession.title = title;
      chatSession.updated = Date.now();

      await this.cacheManager.set(
        this.getChatSessionKey(userId, sessionId),
        chatSession,
      );

      return chatSession;
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error updating chat session title: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async deleteChatSession(userId: string, sessionId: string): Promise<void> {
    try {
      const chatSessions = await this.getAllChatSessions(userId);
      const updatedSessions = chatSessions.filter((id) => id !== sessionId);
      await this.cacheManager.set(this.getChatKey(userId), updatedSessions);

      await this.cacheManager.del(this.getChatSessionKey(userId, sessionId));
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error deleting chat session: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async getAllChatSessionsWithDetails(userId: string): Promise<ChatSession[]> {
    try {
      const sessionIds = await this.getAllChatSessions(userId);
      const sessions = await Promise.all(
        sessionIds.map((id) => this.getChatSession(userId, id)),
      );

      return sessions
        .filter((session): session is ChatSession => session !== null)
        .sort((a, b) => b.updated - a.updated);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `Error getting all chat sessions with details: ${errorMessage}`,
        error instanceof Error ? error.stack : undefined,
      );
      return [];
    }
  }
}
