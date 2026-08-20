import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { DataSource, EntityManager, Repository } from 'typeorm';
import type { User } from '../users/entities/user.entity';
import type { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import type { Wallet } from '../wallets/entities/wallet.entity';
import { UserRole } from '../../common/enums/user-role.enum';
import { MechanicVerificationStatus } from '../../common/enums/mechanic-verification-status.enum';
import { AdminUsersService } from './admin-users.service';
import { MechanicProfile } from './entities/mechanic-profile.entity';

describe('AdminUsersService account moderation', () => {
  const appUser = {
    id: 'user-1',
    role: UserRole.IndividualBidder,
    isBanned: false,
    banReason: null,
    bannedAt: null,
  } as User;
  const userRepository = {
    findOneBy: jest.fn(),
    count: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<User>>;
  const manager = {
    getRepository: jest.fn(() => userRepository),
    query: jest.fn(),
    update: jest.fn(),
  } as unknown as jest.Mocked<EntityManager>;
  const dataSource = {
    transaction: jest.fn(async (work: (value: EntityManager) => unknown) => work(manager)),
  } as unknown as jest.Mocked<DataSource>;
  const service = new AdminUsersService(
    userRepository,
    {} as Repository<Wallet>,
    {} as Repository<WalletLedgerEntry>,
    dataSource,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    Object.assign(appUser, {
      role: UserRole.IndividualBidder,
      isBanned: false,
      banReason: null,
      bannedAt: null,
    });
    userRepository.findOneBy.mockResolvedValue(appUser);
    userRepository.save.mockImplementation(async (user) => user as User);
  });

  it('bans both account records and revokes active sessions atomically', async () => {
    (manager.query as jest.Mock)
      .mockResolvedValueOnce([[], 1])
      .mockResolvedValueOnce([[], 1]);

    const result = await service.banUser('admin-2', appUser.id, { reason: 'QA security test' });

    expect(result.user.isBanned).toBe(true);
    expect(result.user.banReason).toBe('QA security test');
    expect(manager.query).toHaveBeenNthCalledWith(
      2,
      'DELETE FROM auth_sessions WHERE user_id = $1',
      [appUser.id],
    );
  });

  it('unbans both account records', async () => {
    Object.assign(appUser, { isBanned: true, banReason: 'QA', bannedAt: new Date() });
    (manager.query as jest.Mock).mockResolvedValueOnce([[], 1]);

    const result = await service.unbanUser(appUser.id);

    expect(result.user.isBanned).toBe(false);
    expect(result.user.banReason).toBeNull();
    expect(result.user.bannedAt).toBeNull();
  });

  it('revokes the public mechanic profile when a mechanic is banned', async () => {
    appUser.role = UserRole.Mechanic;
    (manager.query as jest.Mock)
      .mockResolvedValueOnce([[], 1])
      .mockResolvedValueOnce([[], 1]);

    await service.banUser('admin-2', appUser.id, { reason: 'Verification revoked' });

    expect(manager.update).toHaveBeenCalledWith(
      MechanicProfile,
      { userId: appUser.id },
      {
        status: MechanicVerificationStatus.Revoked,
        verifiedById: null,
        verifiedAt: null,
      },
    );
  });

  it('rolls back when the linked auth account is missing', async () => {
    (manager.query as jest.Mock).mockResolvedValueOnce([[], 0]);

    await expect(service.banUser('admin-2', appUser.id, { reason: 'QA' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects an already banned user', async () => {
    appUser.isBanned = true;

    await expect(service.banUser('admin-2', appUser.id, { reason: 'QA' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects an administrator banning their own account', async () => {
    await expect(
      service.banUser(appUser.id, appUser.id, { reason: 'QA' }),
    ).rejects.toThrow('You cannot ban your own account');
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('protects the last active administrator', async () => {
    appUser.role = UserRole.Admin;
    userRepository.count.mockResolvedValue(1);

    await expect(
      service.banUser('admin-2', appUser.id, { reason: 'QA' }),
    ).rejects.toThrow('The last active administrator cannot be banned');
  });
});
