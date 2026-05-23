import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { AuctionStatus } from '../../../common/enums/auction-status.enum';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class ListAuctionsQueryDto {
  @ApiPropertyOptional({ enum: ListingCategory })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;

  @ApiPropertyOptional({ enum: AuctionStatus })
  @IsOptional()
  @IsEnum(AuctionStatus)
  status?: AuctionStatus;

  @ApiPropertyOptional({ example: 'camry', description: 'Search keyword' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Minimum base price in kobo (inclusive)',
    example: 1_000_000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPriceKobo?: number;

  @ApiPropertyOptional({
    description: 'Maximum base price in kobo (inclusive)',
    example: 5_000_000_000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPriceKobo?: number;

  @ApiPropertyOptional({
    description: 'Minimum car year (cars only)',
    example: 2015,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  minYear?: number;

  @ApiPropertyOptional({
    description: 'Maximum car year (cars only)',
    example: 2024,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1900)
  maxYear?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
