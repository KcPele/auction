import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateWithdrawalDto {
  @ApiProperty({ example: 500000 })
  @IsInt()
  @Min(10000)
  amountKobo!: number;

  @ApiProperty({ example: '057' })
  @IsString()
  @MaxLength(32)
  destinationBankCode!: string;

  @ApiProperty({ example: 'Zenith Bank' })
  @IsString()
  @MaxLength(120)
  destinationBankName!: string;

  @ApiProperty({ example: '2085096393' })
  @IsString()
  @MaxLength(32)
  destinationAccountNumber!: string;

  @ApiProperty({ example: 'Ada Lovelace' })
  @IsString()
  @MaxLength(160)
  destinationAccountName!: string;

  @ApiPropertyOptional({ example: 'Auction wallet withdrawal' })
  @IsOptional()
  @IsString()
  @MaxLength(160)
  narration?: string;
}
