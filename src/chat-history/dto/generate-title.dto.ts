import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTitleDto {
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
    description: 'First message content to generate title from',
    example: 'How do I create a test case in Katalon Studio?',
  })
  @IsString()
  @IsNotEmpty()
  firstMessage: string;
}
