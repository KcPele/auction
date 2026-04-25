import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class BanUserDto {
  @ApiProperty({ example: 'Violated terms of service' })
  @IsString()
  reason!: string;
}
