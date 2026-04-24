import { IsEnum, IsUUID } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class GrantListingPermissionDto {
  @IsUUID()
  userId!: string;

  @IsEnum(ListingCategory)
  category!: ListingCategory;
}

