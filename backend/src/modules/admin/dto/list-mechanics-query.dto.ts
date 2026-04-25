import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListMechanicsQueryDto {
  @ApiPropertyOptional({ description: 'Search by name or shop' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by verification status' })
  @IsOptional()
  @IsString()
  status?: string;
}
