import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class CreateAccessCodeDto {
  @ApiProperty({ enum: ListingCategory, example: ListingCategory.Car })
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @ApiPropertyOptional({ example: 'AUC-CAR-2026' })
  @IsOptional()
  @IsString()
  code?: string;

  @ApiPropertyOptional({ example: '2026-05-30T10:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}
