import { BadRequestException } from '@nestjs/common';
import type { Repository } from 'typeorm';
import { MechanicVerificationStatus } from '../../common/enums/mechanic-verification-status.enum';
import { AdminMechanicsService } from './admin-mechanics.service';
import type { MechanicProfile } from './entities/mechanic-profile.entity';

describe('AdminMechanicsService verification safety', () => {
  const repository = {
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<Repository<MechanicProfile>>;
  const service = new AdminMechanicsService(repository);

  beforeEach(() => {
    jest.clearAllMocks();
    repository.save.mockImplementation(async (profile) => profile as MechanicProfile);
  });

  it('rejects verification while the linked user is banned', async () => {
    repository.findOne.mockResolvedValue({
      id: 'mechanic-id',
      status: MechanicVerificationStatus.Revoked,
      user: { isActive: true, isBanned: true },
    } as MechanicProfile);

    await expect(
      service.verifyMechanic('admin-id', 'mechanic-id'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(repository.save).not.toHaveBeenCalled();
  });

  it('verifies an active, unbanned mechanic account', async () => {
    repository.findOne.mockResolvedValue({
      id: 'mechanic-id',
      status: MechanicVerificationStatus.Pending,
      user: { isActive: true, isBanned: false },
      verifiedById: null,
      verifiedAt: null,
    } as MechanicProfile);

    const result = await service.verifyMechanic('admin-id', 'mechanic-id');

    expect(result.mechanic.status).toBe(MechanicVerificationStatus.Verified);
    expect(result.mechanic.verifiedById).toBe('admin-id');
  });
});

describe('AdminMechanicsService listing', () => {
  it('returns a requested page and the filtered total', async () => {
    const profiles = [
      {
        id: 'mechanic-id',
        userId: 'user-id',
        user: {
          firstName: 'Ada',
          lastName: 'Okafor',
          isActive: true,
          isBanned: false,
        },
        shopName: 'Ada Autos',
        city: 'Lagos',
        inspectionCount: 4,
        ratingCount: 2,
        ratingSum: 9,
        status: MechanicVerificationStatus.Verified,
      },
    ];
    const queryBuilder = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      take: jest.fn(),
      skip: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([profiles, 31]),
    };
    for (const method of [
      'leftJoinAndSelect',
      'where',
      'andWhere',
      'orderBy',
      'take',
      'skip',
    ] as const) {
      queryBuilder[method].mockReturnValue(queryBuilder);
    }
    const repository = {
      createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
    };
    const service = new AdminMechanicsService(repository as never);

    const result = await service.listMechanics({
      status: MechanicVerificationStatus.Verified,
      limit: 25,
      offset: 25,
    });

    expect(queryBuilder.take).toHaveBeenCalledWith(25);
    expect(queryBuilder.skip).toHaveBeenCalledWith(25);
    expect(result.total).toBe(31);
    expect(result.items[0]).toEqual(
      expect.objectContaining({ name: 'Ada Okafor', rating: 4.5 }),
    );
  });

  it('can query the exact assigned mechanic used in listing review', async () => {
    const queryBuilder = {
      leftJoinAndSelect: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      take: jest.fn(),
      skip: jest.fn(),
      getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
    };
    for (const method of [
      'leftJoinAndSelect',
      'where',
      'andWhere',
      'orderBy',
      'take',
      'skip',
    ] as const) {
      queryBuilder[method].mockReturnValue(queryBuilder);
    }
    const service = new AdminMechanicsService(
      {
        createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
      } as never,
    );
    const mechanicId = '65ce2b84-7ca9-4eb4-b412-e95cbd5e0f02';

    await service.listMechanics({
      mechanicId,
      limit: 1,
      offset: 0,
    });

    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      'mp.id = :mechanicId',
      { mechanicId },
    );
  });
});
