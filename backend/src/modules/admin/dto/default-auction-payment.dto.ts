import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, MaxLength } from 'class-validator';

export class DefaultAuctionPaymentDto {
  @ApiPropertyOptional({ example: 'Winner did not pay within 24 hours' })
  @IsOptional()
  @MaxLength(240)
  reason?: string;
}
