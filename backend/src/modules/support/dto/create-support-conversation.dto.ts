import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateSupportConversationDto {
  @ApiPropertyOptional({ example: 'Question about wallet hold' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  subject?: string;
}
