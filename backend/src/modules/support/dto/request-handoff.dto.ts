import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RequestHandoffDto {
  @ApiPropertyOptional({ example: 'I need help with my withdrawal.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
