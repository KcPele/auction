import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, Matches } from 'class-validator';

export class UpdatePaymentAccountDto {
  @ApiProperty({ example: 'Providus Bank' })
  @IsString()
  @MaxLength(120)
  bankName!: string;

  @ApiProperty({ example: '3635734512' })
  @IsString()
  @MaxLength(32)
  @Matches(/^[0-9]+$/)
  accountNumber!: string;

  @ApiProperty({ example: 'KcPele Auctions' })
  @IsString()
  @MaxLength(160)
  accountName!: string;
}
