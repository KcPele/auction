import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches, MaxLength } from 'class-validator';

export class ConfirmBvnDto {
  @ApiProperty({ example: '6693fec5' })
  @IsString()
  @MaxLength(128)
  transactionId!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{4,6}$/)
  otp!: string;
}
