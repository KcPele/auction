import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class UpdatePlatformFeeDto {
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @IsInt()
  @Min(0)
  @Max(10000)
  sellerFeeBps!: number;

  @IsInt()
  @Min(0)
  @Max(10000)
  buyerFeeBps!: number;
}

