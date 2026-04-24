import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, Max, Min } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class UpdatePlatformFeeDto {
  @ApiProperty({ enum: ListingCategory, example: ListingCategory.Car })
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @ApiProperty({ example: 300, minimum: 0, maximum: 10000 })
  @IsInt()
  @Min(0)
  @Max(10000)
  sellerFeeBps!: number;

  @ApiProperty({ example: 0, minimum: 0, maximum: 10000 })
  @IsInt()
  @Min(0)
  @Max(10000)
  buyerFeeBps!: number;
}
