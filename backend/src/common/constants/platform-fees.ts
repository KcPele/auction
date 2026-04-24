import { ListingCategory } from '../enums/listing-category.enum';

export const DefaultPlatformFees = {
  [ListingCategory.Car]: {
    sellerPercent: 3,
    buyerPercent: 0,
  },
  [ListingCategory.Gadget]: {
    sellerPercent: 5,
    buyerPercent: 0,
  },
} as const;

