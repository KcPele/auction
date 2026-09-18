import type { EntityManager } from 'typeorm';
import { prepareBetaAccount } from './prepare-beta-account';

describe('prepareBetaAccount', () => {
  it('verifies only the linked account selected by exact email', async () => {
    const query = jest
      .fn()
      .mockResolvedValueOnce([
        {
          id: '11111111-1111-1111-1111-111111111111',
          email: 'beta.biddera.20260917a@bidnaija.local',
        },
      ])
      .mockResolvedValue([]);
    const manager = { query } as unknown as EntityManager;

    await prepareBetaAccount(manager, {
      email: 'BETA.BIDDERA.20260917A@BIDNAIJA.LOCAL',
      verifyEmail: true,
      verifyKyc: true,
    });

    expect(query).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('WHERE LOWER(u.email) = LOWER($1)'),
      ['beta.biddera.20260917a@bidnaija.local'],
    );
    expect(query).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('UPDATE auth_users'),
      ['11111111-1111-1111-1111-111111111111'],
    );
    expect(query).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('UPDATE users'),
      ['11111111-1111-1111-1111-111111111111'],
    );
    expect(query).toHaveBeenNthCalledWith(
      4,
      expect.stringMatching(/INSERT INTO kyc_profiles[\s\S]*\$1::uuid/),
      ['11111111-1111-1111-1111-111111111111'],
    );
  });

  it('refuses to update when the linked account is missing', async () => {
    const manager = {
      query: jest.fn().mockResolvedValue([]),
    } as unknown as EntityManager;

    await expect(
      prepareBetaAccount(manager, {
        email: 'missing@bidnaija.local',
        verifyEmail: true,
        verifyKyc: false,
      }),
    ).rejects.toThrow(
      'Expected one linked user for missing@bidnaija.local, found 0',
    );
  });
});
