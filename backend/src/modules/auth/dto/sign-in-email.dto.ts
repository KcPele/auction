import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUrl } from 'class-validator';

export class SignInEmailDto {
  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ example: 'strongPassword123' })
  @IsString()
  password!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackURL?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
