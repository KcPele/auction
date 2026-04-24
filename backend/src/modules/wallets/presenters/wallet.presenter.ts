import type { Wallet } from '../entities/wallet.entity';

export function presentWallet(wallet: Wallet) {
  return {
    id: wallet.id,
    userId: wallet.userId,
    currency: wallet.currency,
    balanceKobo: wallet.balanceKobo,
    heldKobo: wallet.heldKobo,
    availableKobo: wallet.balanceKobo - wallet.heldKobo,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}
