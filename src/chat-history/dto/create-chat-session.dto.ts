import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ChatConfig } from '../../core/interfaces/chat-history.interface';

export class CreateChatSessionDto {
  @ApiProperty({
    description: 'User identifier',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Session identifier',
    example: 'session-456',
  })
  @IsString()
  @IsNotEmpty()
  sessionId: string;

  @ApiProperty({
    description: 'Chat session title',
    example: 'Troubleshooting Katalon Studio',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Chat configuration',
    example: {
      model: 'gemini-2.0-flash',
      mode: 'standard',
    },
  })
  @IsObject()
  @IsNotEmpty()
  config: ChatConfig;
}
