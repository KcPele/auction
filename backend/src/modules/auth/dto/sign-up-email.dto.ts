import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MinLength,
} from 'class-validator';
import { UserRole } from '../../../common/enums/user-role.enum';

const selfRegistrationRoles = [
  UserRole.IndividualBidder,
  UserRole.CarDealer,
  UserRole.Mechanic,
] as const;

export class SignUpEmailDto {
  @ApiProperty({ example: 'Ada Okafor' })
  @IsString()
  name!: string;

  @ApiProperty({ example: 'buyer@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 8, example: 'strongPassword123' })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({ example: '+2348012345678' })
  @IsString()
  phone!: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({
    enum: selfRegistrationRoles,
    default: UserRole.IndividualBidder,
  })
  @IsOptional()
  @IsIn(selfRegistrationRoles)
  appRole?: (typeof selfRegistrationRoles)[number];

  @ApiPropertyOptional({ example: '12345678901' })
  @IsOptional()
  @IsString()
  nin?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  image?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl({ require_tld: false })
  callbackURL?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  rememberMe?: boolean;
}
