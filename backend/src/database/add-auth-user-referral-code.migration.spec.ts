import type { QueryRunner } from 'typeorm';
import { AddAuthUserReferralCode1780000500000 } from './migrations/1780000500000-AddAuthUserReferralCode';

describe('AddAuthUserReferralCode1780000500000', () => {
  it('adds the referral code field used by signup', async () => {
    const query = jest.fn().mockResolvedValue(undefined);
    const migration = new AddAuthUserReferralCode1780000500000();

    await migration.up({ query } as unknown as QueryRunner);

    expect(query).toHaveBeenCalledWith(
      expect.stringContaining('ADD COLUMN IF NOT EXISTS "referral_code"'),
    );
  });
});
