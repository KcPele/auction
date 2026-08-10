import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsUrl } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiPropertyOptional({ example: 'http://localhost:3000/reset' })
  @IsOptional()
  @IsUrl({ require_tld: false })
  redirectTo?: string;
}
