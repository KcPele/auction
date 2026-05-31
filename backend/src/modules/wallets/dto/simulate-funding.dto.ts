import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive, Max } from 'class-validator';

/**
 * Body for `POST /wallets/topup/simulate` — sandbox-only.
 * Naira amount the user wants credited. Capped to keep test data sane.
 */
export class SimulateFundingDto {
  @ApiProperty({ example: 500_000, description: 'Amount in naira' })
  @IsNumber()
  @IsPositive()
  @Max(50_000_000)
  amountNaira!: number;
}
