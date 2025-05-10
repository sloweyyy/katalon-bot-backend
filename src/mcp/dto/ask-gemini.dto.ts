/* eslint-disable @typescript-eslint/no-unsafe-call */
import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class ChatPart {
  @ApiProperty({
    description: 'The text content of a chat message part',
    example: 'Hello, how can I help you with Katalon today?',
  })
  @IsString()
  text: string;
}

class ChatHistoryItem {
  @ApiProperty({
    description: 'The role of the message sender',
    enum: ['user', 'model'],
    example: 'user',
  })
  @IsString()
  role: 'user' | 'model';

  @ApiProperty({
    description: 'The parts that make up the message content',
    type: [ChatPart],
    example: [{ text: 'Hello, I need help with Katalon Studio' }],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatPart)
  parts: ChatPart[];
}

export class AskGeminiDto {
  @ApiProperty({
    description: 'Unique identifier for the chat session',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  sessionId: string;

  @ApiProperty({
    description: 'The current message from the user',
    example: 'How do I set up a test case in Katalon Studio?',
  })
  @IsString()
  message: string;

  @ApiProperty({
    description: 'System instructions to guide the AI model response',
    required: false,
    example: 'Provide concise, accurate responses about Katalon products.',
  })
  @IsString()
  @IsOptional()
  systemInstruction?: string;

  @ApiProperty({
    description: 'Previous conversation history for context',
    type: [ChatHistoryItem],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItem)
  history?: ChatHistoryItem[];
}
