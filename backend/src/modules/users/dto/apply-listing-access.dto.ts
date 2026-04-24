import { IsEnum, IsString, MinLength } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class ApplyListingAccessDto {
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @IsString()
  @MinLength(10)
  reason!: string;
}

