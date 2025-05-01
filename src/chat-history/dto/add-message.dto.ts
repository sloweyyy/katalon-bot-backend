import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Message } from '../../core/interfaces/chat-history.interface';

export class AddMessageDto {
  @ApiProperty({
    description: 'User identifier',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Message to add to the chat session',
    example: {
      content: 'How do I create a test case in Katalon Studio?',
      isUser: true,
      id: 'msg-123',
      timestamp: 1625097600000,
    },
  })
  @IsObject()
  @IsNotEmpty()
  message: Message;
}
