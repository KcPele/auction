import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, MaxLength, Min } from 'class-validator';

export class SettleAuctionPaymentDto {
  @ApiPropertyOptional({ example: 100000000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  externalPaymentKobo?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  walletPaymentKobo?: number;

  @ApiPropertyOptional({ example: 'Bank transfer confirmed by admin' })
  @IsOptional()
  @MaxLength(240)
  note?: string;
}
