import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class VerifyBvnDto {
  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Matches(/^[0-9]{11}$/)
  number!: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  firstName!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  lastName!: string;

  @ApiProperty({ example: '09-10-1990' })
  @IsString()
  dateOfBirth!: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  phoneNumber!: string;
}
