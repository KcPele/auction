import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class CreateAccessCodeDto {
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

