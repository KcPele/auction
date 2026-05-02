import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

export class AccountNameQueryDto {
  @ApiProperty({ example: '057' })
  @IsString()
  @MaxLength(32)
  bankCode!: string;

  @ApiProperty({ example: '2085096393' })
  @IsString()
  @MaxLength(32)
  accountNumber!: string;
}
