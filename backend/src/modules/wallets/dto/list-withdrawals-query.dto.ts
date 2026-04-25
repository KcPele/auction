import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { WalletWithdrawalStatus } from '../../../common/enums/wallet-withdrawal-status.enum';

export class ListWithdrawalsQueryDto {
  @ApiPropertyOptional({ enum: WalletWithdrawalStatus })
  @IsOptional()
  @IsEnum(WalletWithdrawalStatus)
  status?: WalletWithdrawalStatus;

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
