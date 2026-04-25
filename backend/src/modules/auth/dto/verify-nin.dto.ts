import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class VerifyNinDto {
  @ApiProperty({ example: '12345678901' })
  @IsString()
  nin!: string;
}
