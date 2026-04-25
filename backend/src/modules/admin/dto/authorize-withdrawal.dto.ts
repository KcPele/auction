import { ApiProperty } from '@nestjs/swagger';
import { IsString, Length, Matches } from 'class-validator';

export class AuthorizeWithdrawalDto {
  @ApiProperty({ example: '886850' })
  @IsString()
  @Length(4, 12)
  @Matches(/^[0-9]+$/)
  authorizationCode!: string;
}
