import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class SendOtpDto {
  @ApiProperty({ example: '08123456789' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  @Matches(/^[0-9]{4,6}$/)
  otp!: string;
}
