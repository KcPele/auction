import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsUUID } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class GrantListingPermissionDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: ListingCategory, example: ListingCategory.Gadget })
  @IsEnum(ListingCategory)
  category!: ListingCategory;
}
