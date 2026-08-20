import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, Max, Min } from 'class-validator';

export type WalletActivityBucket = 'top' | 'hold' | 'release' | 'pay';

export class ListWalletLedgerQueryDto {
  @ApiPropertyOptional({ enum: ['top', 'hold', 'release', 'pay'] })
  @IsOptional()
  @IsIn(['top', 'hold', 'release', 'pay'])
  activity?: WalletActivityBucket;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
