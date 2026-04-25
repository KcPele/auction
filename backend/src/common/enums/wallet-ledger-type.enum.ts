export enum WalletLedgerType {
  WalletFundingConfirmed = 'WALLET_FUNDING_CONFIRMED',
  WithdrawalRequested = 'WITHDRAWAL_REQUESTED',
  WithdrawalFailed = 'WITHDRAWAL_FAILED',
  WithdrawalConfirmed = 'WITHDRAWAL_CONFIRMED',
  BidHoldCreated = 'BID_HOLD_CREATED',
  BidHoldReleased = 'BID_HOLD_RELEASED',
  BidHoldApplied = 'BID_HOLD_APPLIED',
  BidHoldForfeited = 'BID_HOLD_FORFEITED',
  FinalPaymentConfirmed = 'FINAL_PAYMENT_CONFIRMED',
  AdminAdjustment = 'ADMIN_ADJUSTMENT',
}
