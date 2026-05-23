import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class UpdateSupportSettingsDto {
  @ApiPropertyOptional({ example: 'openai/gpt-4o-mini' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  model?: string;

  @ApiPropertyOptional({ example: 0.2, minimum: 0, maximum: 2 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({ example: 800, minimum: 64, maximum: 4000 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(64)
  @Max(4000)
  maxOutputTokens?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  systemPromptOverride?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;
}
