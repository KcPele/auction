import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsIn } from 'class-validator';

export class SendVerificationOtpDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ enum: ['email-verification'], example: 'email-verification' })
  @IsIn(['email-verification'])
  type!: 'email-verification';
}
