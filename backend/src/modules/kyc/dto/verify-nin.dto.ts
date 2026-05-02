import { ApiProperty } from '@nestjs/swagger';
import { IsString, Matches } from 'class-validator';

export class VerifyNinDto {
  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Matches(/^[0-9]{11}$/)
  numberNin!: string;

  @ApiProperty({ example: 'Okafor' })
  @IsString()
  surname!: string;

  @ApiProperty({ example: 'Ada' })
  @IsString()
  firstname!: string;

  @ApiProperty({ example: '09-10-1990' })
  @IsString()
  birthdate!: string;

  @ApiProperty({ example: '08123456789' })
  @IsString()
  telephoneno!: string;
}
