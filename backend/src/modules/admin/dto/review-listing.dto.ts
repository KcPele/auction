import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ReviewListingDto {
  @ApiPropertyOptional({ example: 'Listing details verified.' })
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

