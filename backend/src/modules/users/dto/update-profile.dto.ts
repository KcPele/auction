import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{11}$/)
  nin?: string;
}

