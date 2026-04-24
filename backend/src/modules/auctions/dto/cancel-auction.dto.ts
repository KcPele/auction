import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class CancelAuctionDto {
  @ApiPropertyOptional({ example: 'Listing issue found before auction start.' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  reason?: string;
}
