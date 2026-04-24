import { ListingCategory } from '../enums/listing-category.enum';

export const DefaultPlatformFees = {
  [ListingCategory.Car]: {
    sellerFeeBps: 300,
    buyerFeeBps: 0,
  },
  [ListingCategory.Gadget]: {
    sellerFeeBps: 500,
    buyerFeeBps: 0,
  },
} as const;
