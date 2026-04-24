import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RedeemAccessCodeDto {
  @ApiProperty({ example: 'AUC-1A2B3C4D' })
  @IsString()
  @MinLength(6)
  code!: string;
}
