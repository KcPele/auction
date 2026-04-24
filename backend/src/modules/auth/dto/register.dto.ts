import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

export class RegisterDto {
  @IsEmail()
  email!: string;

  @IsString()
  @Matches(/^\+?[0-9]{8,15}$/)
  phone!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{11}$/)
  nin?: string;
}

