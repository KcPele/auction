import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({ example: 'token-value-here' })
  @IsString()
  token!: string;

  @ApiProperty({ example: 'newStrongPassword123' })
  @IsString()
  newPassword!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  callbackURL?: string;
}
