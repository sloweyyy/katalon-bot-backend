import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { GeminiModule } from './gemini/gemini.module';
import { McpModule } from './mcp/mcp.module';
import { ChatHistoryModule } from './chat-history/chat-history.module';
import { CoreModule } from './core/core.module';

@Module({
  imports: [CoreModule, GeminiModule, McpModule, ChatHistoryModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
