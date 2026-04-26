import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ConfirmPaymentDto {
  @ApiPropertyOptional({ example: 'Bank transfer via GTBank', maxLength: 240 })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  note?: string;
}
