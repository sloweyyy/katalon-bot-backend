import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTitleDto {
  @ApiProperty({
    description: 'User identifier',
    example: 'user123',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'New chat session title',
    example: 'Debugging Katalon Test Cases',
  })
  @IsString()
  @IsNotEmpty()
  title: string;
}
