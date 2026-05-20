export type AuctionCategoryWire = "CAR" | "GADGET";

export type AuctionStatusWire =
  | "DRAFT"
  | "PENDING_APPROVAL"
  | "SCHEDULED"
  | "LIVE"
  | "ENDED"
  | "AWAITING_PAYMENT"
  | "SETTLED"
  | "DEFAULTED"
  | "CANCELLED"
  | "RELISTED";

export type AuctionDto = {
  id: string;
  category: AuctionCategoryWire;
  listingId: string;
  sellerId: string;
  basePriceKobo: number;
  minimumBidIncrementKobo: number;
  holdPercent: number;
  sellerFeeBps: number;
  buyerFeeBps: number;
  startTime: string;
  durationMinutes: number;
  endTime: string;
  status: AuctionStatusWire;
  currentWinningBidId: string | null;
  winnerId: string | null;
  paymentDeadlineAt: string | null;
  externalPaymentKobo: number | null;
  walletPaymentKobo: number | null;
  settledById: string | null;
  settledAt: string | null;
  defaultedAt: string | null;
  defaultReason: string | null;
  cancelledById: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CarListingDto = {
  id: string;
  type: "car";
  make: string;
  model: string;
  year: number;
  colour: string | null;
  registrationNumber: string | null;
  mileage: number | null;
  condition: string | null;
  knownFaults: string | null;
  mechanicId: string | null;
  photoUrls: string[];
  basePriceKobo: number;
  status: string;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type GadgetListingDto = {
  id: string;
  type: "gadget";
  gadgetType: string;
  brand: string;
  model: string;
  colour: string | null;
  batteryHealthPercent: number | null;
  specs: string | null;
  usageHistory: string | null;
  defects: string | null;
  proofDocumentUrl: string | null;
  photoUrls: string[];
  videoUrls: string[];
  basePriceKobo: number;
  status: string;
  reviewedById: string | null;
  reviewNote: string | null;
  reviewedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ListingDto = CarListingDto | GadgetListingDto;

export type ListAuctionsResponseDto = { auctions: AuctionDto[] };
export type GetAuctionResponseDto = {
  auction: AuctionDto;
  listing: ListingDto | null;
};

export type BidStatusWire =
  | "WINNING"
  | "ACCEPTED"
  | "OUTBID"
  | "REJECTED";

export type BidDto = {
  id: string;
  userId: string;
  handle: string;
  amountKobo: number;
  placedAt: string;
  isLeading: boolean;
  status: BidStatusWire;
};

export type ListBidsResponseDto = { bids: BidDto[] };

export type PlaceBidResponseDto = {
  response: {
    bid: { id: string; amountKobo: number; status: BidStatusWire };
    bidRequirement: { percent: number; requiredBalanceKobo: number };
    auction: AuctionDto;
    isTopBid: boolean;
  };
};

export type PaymentInstructionsDto = {
  auction: AuctionDto;
  winningBid: { id: string; amountKobo: number };
  paymentDeadlineAt: string | null;
  paymentAccount: {
    bankName: string;
    accountNumber: string;
    accountName: string;
  };
};

// View models
export type AuctionCategory = "cars" | "gadgets";

export type Auction = {
  id: string;
  category: AuctionCategory;
  title: string;
  subtitle: string | null;
  basePrice: number; // naira
  status: AuctionStatusWire;
  isLive: boolean;
  isUpcoming: boolean;
  isEnded: boolean;
  startTime: Date;
  endTime: Date;
  paymentDeadlineAt: Date | null;
  winnerId: string | null;
  sellerId: string;
  listingId: string;
  minimumBidIncrement: number;
  holdPercent: number;
  photoUrl: string | null;
};

export type AuctionDetail = Auction & {
  listing: ListingDto | null;
};

export type Bid = {
  id: string;
  userId: string;
  handle: string;
  amount: number; // naira
  placedAt: Date;
  isLeading: boolean;
  status: BidStatusWire;
};

export type PaymentInstructions = {
  auction: Auction;
  amountDue: number; // naira
  paymentDeadlineAt: Date | null;
  bankName: string;
  accountNumber: string;
  accountName: string;
};
