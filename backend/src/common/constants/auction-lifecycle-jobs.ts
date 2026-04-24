export const AuctionLifecycleJobNames = {
  Start: 'auction.start',
  Close: 'auction.close',
} as const;

export const PaymentDeadlineJobNames = {
  Forfeit: 'payment-deadline.forfeit',
} as const;

export type AuctionLifecycleJobData = {
  auctionId: string;
};

export type PaymentDeadlineJobData = {
  auctionId: string;
};
