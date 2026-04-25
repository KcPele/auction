import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ResolveDisputeDto {
  @ApiProperty({ example: 'Full refund issued to buyer' })
  @IsString()
  resolution!: string;
}
