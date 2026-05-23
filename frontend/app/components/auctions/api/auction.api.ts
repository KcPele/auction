import { apiClient } from "@/app/lib/api/client";
import { koboToNaira, nairaToKobo } from "@/app/lib/format/money";
import type {
  Auction,
  AuctionCategory,
  AuctionDetail,
  AuctionDto,
  Bid,
  GetAuctionResponseDto,
  ListAuctionsResponseDto,
  ListBidsResponseDto,
  ListingDto,
  PaymentInstructions,
  PaymentInstructionsDto,
  PlaceBidResponseDto,
} from "../types/auction.types";

const titleFor = (listing: ListingDto | null): { title: string; subtitle: string | null } => {
  if (!listing) return { title: "Auction", subtitle: null };
  if (listing.type === "car") {
    return {
      title: `${listing.year} ${listing.make} ${listing.model}`.trim(),
      subtitle: listing.condition,
    };
  }
  return {
    title: `${listing.brand} ${listing.model}`.trim(),
    subtitle: listing.gadgetType,
  };
};

const photoFor = (listing: ListingDto | null): string | null => {
  if (!listing) return null;
  return listing.photoUrls?.[0] ?? null;
};

const toAuction = (
  dto: AuctionDto,
  listing: ListingDto | null = null,
): Auction => {
  const { title, subtitle } = titleFor(listing);
  return {
    id: dto.id,
    category: dto.category === "CAR" ? "cars" : "gadgets",
    title,
    subtitle,
    basePrice: koboToNaira(dto.basePriceKobo),
    status: dto.status,
    isLive: dto.status === "LIVE",
    isUpcoming: dto.status === "SCHEDULED",
    isEnded:
      dto.status === "ENDED" ||
      dto.status === "AWAITING_PAYMENT" ||
      dto.status === "SETTLED" ||
      dto.status === "DEFAULTED" ||
      dto.status === "CANCELLED",
    startTime: new Date(dto.startTime),
    endTime: new Date(dto.endTime),
    paymentDeadlineAt: dto.paymentDeadlineAt
      ? new Date(dto.paymentDeadlineAt)
      : null,
    winnerId: dto.winnerId,
    sellerId: dto.sellerId,
    listingId: dto.listingId,
    minimumBidIncrement: koboToNaira(dto.minimumBidIncrementKobo),
    holdPercent: dto.holdPercent,
    photoUrl: photoFor(listing),
  };
};

const toBid = (dto: ListBidsResponseDto["bids"][number]): Bid => ({
  id: dto.id,
  userId: dto.userId,
  handle: dto.handle,
  amount: koboToNaira(dto.amountKobo),
  placedAt: new Date(dto.placedAt),
  isLeading: dto.isLeading,
  status: dto.status,
});

export const listAuctions = async (params: {
  category?: AuctionCategory;
  status?: "LIVE" | "SCHEDULED" | "ENDED";
  search?: string;
  limit?: number;
  offset?: number;
  minPriceKobo?: number;
  maxPriceKobo?: number;
  minYear?: number;
  maxYear?: number;
} = {}): Promise<Auction[]> => {
  const dto = await apiClient<ListAuctionsResponseDto>("/auctions", {
    query: {
      category:
        params.category === "cars"
          ? "CAR"
          : params.category === "gadgets"
            ? "GADGET"
            : undefined,
      status: params.status,
      search: params.search,
      limit: params.limit ?? 20,
      offset: params.offset ?? 0,
      minPriceKobo: params.minPriceKobo,
      maxPriceKobo: params.maxPriceKobo,
      minYear: params.minYear,
      maxYear: params.maxYear,
    },
  });
  return dto.auctions.map((a) => toAuction(a, null));
};

export const getAuctionDetail = async (id: string): Promise<AuctionDetail> => {
  const dto = await apiClient<GetAuctionResponseDto>(`/auctions/${id}`);
  return { ...toAuction(dto.auction, dto.listing), listing: dto.listing };
};

export const getAuctionBids = async (id: string): Promise<Bid[]> => {
  const dto = await apiClient<ListBidsResponseDto>(`/auctions/${id}/bids`);
  return dto.bids.map(toBid);
};

export const placeBid = (input: { auctionId: string; amountNaira: number }) =>
  apiClient<PlaceBidResponseDto>(
    `/auctions/${input.auctionId}/bids`,
    {
      method: "POST",
      body: { amountKobo: nairaToKobo(input.amountNaira) },
      headers: { "Idempotency-Key": crypto.randomUUID() },
    },
  );

export const getPaymentInstructions = async (
  id: string,
): Promise<PaymentInstructions> => {
  const dto = await apiClient<PaymentInstructionsDto>(
    `/auctions/${id}/payment-instructions`,
  );
  return {
    auction: toAuction(dto.auction, null),
    amountDue: koboToNaira(dto.winningBid.amountKobo),
    paymentDeadlineAt: dto.paymentDeadlineAt
      ? new Date(dto.paymentDeadlineAt)
      : null,
    bankName: dto.paymentAccount.bankName,
    accountNumber: dto.paymentAccount.accountNumber,
    accountName: dto.paymentAccount.accountName,
  };
};

export const confirmWinnerPayment = (auctionId: string, note?: string) =>
  apiClient<unknown>(`/auctions/${auctionId}/confirm-payment`, {
    method: "POST",
    body: note ? { note } : {},
  });

export type DeliveryStatusWire =
  | "PAYMENT_CONFIRMED"
  | "SELLER_SHIPS"
  | "INSPECTION"
  | "DISPATCH"
  | "DELIVERED";

export type DeliveryDto = {
  id: string;
  auctionId: string;
  winnerId: string;
  sellerId: string;
  status: DeliveryStatusWire;
  trackingInfo: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Delivery = {
  id: string;
  auctionId: string;
  status: DeliveryStatusWire;
  trackingInfo: string | null;
  updatedAt: Date;
};

export const getDelivery = async (auctionId: string): Promise<Delivery> => {
  const dto = await apiClient<{ delivery: DeliveryDto }>(
    `/auctions/${auctionId}/delivery`,
  );
  return {
    id: dto.delivery.id,
    auctionId: dto.delivery.auctionId,
    status: dto.delivery.status,
    trackingInfo: dto.delivery.trackingInfo,
    updatedAt: new Date(dto.delivery.updatedAt),
  };
};
