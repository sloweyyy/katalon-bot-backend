import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ChatPart {
  @IsString()
  text: string;
}

class ChatHistoryItem {
  @IsString()
  role: 'user' | 'model';

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatPart)
  parts: ChatPart[];
}

export class AskGeminiDto {
  @IsString()
  sessionId: string;

  @IsString()
  message: string;

  @IsString()
  @IsOptional()
  systemInstruction?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChatHistoryItem)
  history?: ChatHistoryItem[];
}
