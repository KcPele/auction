import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Clears sandbox wallet state before STROWALLET_MODE flips to `live`.
 *
 * Everything funded while the backend ran in sandbox mode is simulated money:
 * virtual accounts were generated locally (`BidNaija Sandbox Bank`, bank code
 * `999999`) and `POST /wallets/topup/simulate` credited balances without a
 * bank transfer. Left in place that balance becomes spendable — and withdrawable
 * as real cash — the moment the live keys are in use.
 *
 * Balances are ledger-derived, so this reverses the money through the ledger
 * (releases, then an ADMIN_ADJUSTMENT per wallet) instead of overwriting
 * `balanceKobo`, keeping `balanceBefore`/`balanceAfter` continuous.
 */
export class RetireSandboxWalletState1780000600000
  implements MigrationInterface
{
  name = 'RetireSandboxWalletState1780000600000';

  async up(queryRunner: QueryRunner): Promise<void> {
    // 1. Release active bid holds, oldest first, so each ledger row carries the
    //    running `heldKobo` rather than assuming one hold per wallet.
    await queryRunner.query(`
      WITH released AS (
        SELECT
          h."id",
          h."walletId",
          h."userId",
          h."auctionId",
          h."amountKobo",
          w."balanceKobo",
          w."heldKobo" - COALESCE(
            SUM(h."amountKobo") OVER (
              PARTITION BY h."walletId"
              ORDER BY h."createdAt", h."id"
              ROWS BETWEEN UNBOUNDED PRECEDING AND 1 PRECEDING
            ),
            0
          ) AS "heldBeforeKobo"
        FROM "wallet_holds" h
        JOIN "wallets" w ON w."id" = h."walletId"
        WHERE h."status" = 'ACTIVE'
      )
      INSERT INTO "wallet_ledger_entries" (
        "walletId", "userId", "type", "amountKobo",
        "balanceBeforeKobo", "balanceAfterKobo",
        "heldBeforeKobo", "heldAfterKobo",
        "reference", "metadata"
      )
      SELECT
        r."walletId",
        r."userId",
        'BID_HOLD_RELEASED',
        r."amountKobo",
        r."balanceKobo",
        r."balanceKobo",
        r."heldBeforeKobo",
        r."heldBeforeKobo" - r."amountKobo",
        'sandbox_teardown_hold_' || r."id",
        jsonb_build_object(
          'sandboxTeardown', true,
          'holdId', r."id",
          'auctionId', r."auctionId"
        )
      FROM released r
    `);
    await queryRunner.query(`
      UPDATE "wallet_holds"
      SET "status" = 'RELEASED', "releasedAt" = now(), "updatedAt" = now()
      WHERE "status" = 'ACTIVE'
    `);

    // 2. Fail in-flight withdrawals. Their provider references only exist in
    //    sandbox, so the live status poller would never resolve them. The
    //    balance they debited is written off by step 3 rather than refunded.
    await queryRunner.query(`
      INSERT INTO "wallet_ledger_entries" (
        "walletId", "userId", "type", "amountKobo",
        "balanceBeforeKobo", "balanceAfterKobo",
        "heldBeforeKobo", "heldAfterKobo",
        "reference", "metadata"
      )
      SELECT
        d."walletId",
        d."userId",
        'WITHDRAWAL_FAILED',
        0,
        w."balanceKobo",
        w."balanceKobo",
        w."heldKobo",
        w."heldKobo",
        'sandbox_teardown_withdrawal_' || d."id",
        jsonb_build_object(
          'sandboxTeardown', true,
          'withdrawalId', d."id",
          'reason', 'Sandbox withdrawal abandoned before live cutover'
        )
      FROM "wallet_withdrawals" d
      JOIN "wallets" w ON w."id" = d."walletId"
      WHERE d."status" IN ('PENDING', 'PROCESSING')
    `);
    await queryRunner.query(`
      UPDATE "wallet_withdrawals"
      SET "status" = 'FAILED', "failedAt" = now(), "updatedAt" = now()
      WHERE "status" IN ('PENDING', 'PROCESSING')
    `);

    // 3. Write the simulated balance off. Holds are settled by now, so
    //    `heldKobo` is already accounted for and lands at zero.
    await queryRunner.query(`
      INSERT INTO "wallet_ledger_entries" (
        "walletId", "userId", "type", "amountKobo",
        "balanceBeforeKobo", "balanceAfterKobo",
        "heldBeforeKobo", "heldAfterKobo",
        "reference", "metadata"
      )
      SELECT
        w."id",
        w."userId",
        'ADMIN_ADJUSTMENT',
        -w."balanceKobo",
        w."balanceKobo",
        0,
        0,
        0,
        'sandbox_teardown_balance_' || w."id",
        jsonb_build_object(
          'sandboxTeardown', true,
          'reason', 'Simulated sandbox balance cleared before STROWALLET_MODE=live'
        )
      FROM "wallets" w
      WHERE w."balanceKobo" <> 0
    `);
    await queryRunner.query(`
      UPDATE "wallets"
      SET "balanceKobo" = 0, "heldKobo" = 0, "updatedAt" = now()
      WHERE "balanceKobo" <> 0 OR "heldKobo" <> 0
    `);

    // 4. Drop the locally generated funding accounts. These must be deleted,
    //    not marked INACTIVE: `accountReference` is unique and the service
    //    rebuilds it as `wallet_<userId>`, so a retained row would collide
    //    when the live virtual account is provisioned.
    await queryRunner.query(`
      DELETE FROM "wallet_funding_accounts"
      WHERE "bankCode" = '999999'
         OR "reservationReference" LIKE 'sandbox_%'
         OR "providerPayload"->>'simulated' = 'true'
    `);
  }

  async down(): Promise<void> {
    // Irreversible by design: the balances this removed were simulated, and
    // restoring them would hand out spendable money against live keys.
  }
}
