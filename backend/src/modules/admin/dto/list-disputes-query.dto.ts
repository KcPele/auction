import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListDisputesQueryDto {
  @ApiPropertyOptional({ description: 'Filter by dispute status' })
  @IsOptional()
  @IsString()
  status?: string;
}
