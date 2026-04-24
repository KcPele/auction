import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewListingApplicationDto {
  @ApiPropertyOptional({ example: 'Documents look good.' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}
