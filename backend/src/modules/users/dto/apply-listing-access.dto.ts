import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString, MinLength } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class ApplyListingAccessDto {
  @ApiProperty({ enum: ListingCategory, example: ListingCategory.Car })
  @IsEnum(ListingCategory)
  category!: ListingCategory;

  @ApiProperty({
    minLength: 10,
    example: 'I am a verified mechanic and inspect cars for sellers.',
  })
  @IsString()
  @MinLength(10)
  reason!: string;
}
