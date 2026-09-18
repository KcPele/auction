import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserListingPermission } from '../users/entities/user-listing-permission.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { Brackets } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { MechanicVerificationStatus } from '../../common/enums/mechanic-verification-status.enum';
import { MechanicProfile } from './entities/mechanic-profile.entity';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(UserListingPermission)
    private readonly listingPermissionsRepository: Repository<UserListingPermission>,
    @InjectRepository(Wallet) private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletLedgerEntry) private readonly ledgerRepository: Repository<WalletLedgerEntry>,
    private readonly dataSource: DataSource,
  ) {}

  async listUsers(query: ListAdminUsersQueryDto) {
    const qb = this.usersRepository.createQueryBuilder('u').leftJoinAndSelect('u.notificationPreference', 'np');

    if (query.search) {
      const term = `%${query.search}%`;
      qb.andWhere(new Brackets((b) => b.where('u.firstName ILIKE :term', { term }).orWhere('u.lastName ILIKE :term', { term }).orWhere('u.email ILIKE :term', { term }).orWhere('u.phone ILIKE :term', { term })));
    }

    if (query.status === 'active') qb.andWhere('u.isActive = true AND u.isBanned = false');
    else if (query.status === 'banned') qb.andWhere('u.isBanned = true');
    else if (query.status === 'inactive') qb.andWhere('u.isActive = false AND u.isBanned = false');

    qb.orderBy('u.createdAt', 'DESC').take(query.limit).skip(query.offset);
    const [users, total] = await qb.getManyAndCount();

    const userIds = users.map((u) => u.id);
    const wallets = userIds.length > 0 ? await this.walletsRepository.find({ where: { userId: In(userIds) } }) : [];
    const listingPermissions = userIds.length > 0
      ? await this.listingPermissionsRepository.find({
          where: { userId: In(userIds) },
          select: { userId: true, category: true },
        })
      : [];
    const walletMap = new Map(wallets.map((w) => [w.userId, w]));
    const permissionsMap = new Map<string, UserListingPermission['category'][]>();
    for (const permission of listingPermissions) {
      const current = permissionsMap.get(permission.userId) ?? [];
      current.push(permission.category);
      permissionsMap.set(permission.userId, current);
    }

    const items = users.map((u) => {
      const wallet = walletMap.get(u.id);
      return {
        id: u.id, handle: `@${u.firstName.toLowerCase()}***`, firstName: u.firstName, lastName: u.lastName,
        email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, isBanned: u.isBanned,
        walletBalanceKobo: wallet?.balanceKobo ?? 0, walletHoldKobo: wallet?.heldKobo ?? 0, createdAt: u.createdAt,
        listingPermissions: permissionsMap.get(u.id) ?? [],
      };
    });

    return { items, total };
  }

  async banUser(adminId: string, userId: string, dto: BanUserDto) {
    if (adminId === userId) {
      throw new BadRequestException('You cannot ban your own account');
    }

    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await this.findUser(userId, users);
      if (user.isBanned) throw new BadRequestException('User is already banned');

      if (user.role === UserRole.Admin) {
        const remainingAdmins = await users.count({
          where: {
            role: UserRole.Admin,
            isActive: true,
            isBanned: false,
          },
        });
        if (remainingAdmins <= 1) {
          throw new BadRequestException('The last active administrator cannot be banned');
        }
      }

      const reason = dto.reason.trim();
      user.isBanned = true;
      user.banReason = reason;
      user.bannedAt = new Date();

      const [, affectedAuthUsers] = await manager.query<[unknown[], number]>(
        `UPDATE auth_users
         SET banned = true, "banReason" = $2, "banExpires" = NULL
         WHERE id = $1
        `,
        [userId, reason],
      );
      if (affectedAuthUsers !== 1) throw new NotFoundException('Linked auth user not found');

      await manager.query('DELETE FROM auth_sessions WHERE user_id = $1', [userId]);
      if (user.role === UserRole.Mechanic) {
        await manager.update(
          MechanicProfile,
          { userId },
          {
            status: MechanicVerificationStatus.Revoked,
            verifiedById: null,
            verifiedAt: null,
          },
        );
      }
      return { user: await users.save(user) };
    });
  }

  async unbanUser(userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await this.findUser(userId, users);
      if (!user.isBanned) throw new BadRequestException('User is not banned');

      user.isBanned = false;
      user.banReason = null;
      user.bannedAt = null;

      const [, affectedAuthUsers] = await manager.query<[unknown[], number]>(
        `UPDATE auth_users
         SET banned = false, "banReason" = NULL, "banExpires" = NULL
         WHERE id = $1
        `,
        [userId],
      );
      if (affectedAuthUsers !== 1) throw new NotFoundException('Linked auth user not found');

      return { user: await users.save(user) };
    });
  }

  async getUserWallet(userId: string) {
    const user = await this.findUser(userId);
    const wallet = await this.walletsRepository.findOneBy({ userId: user.id });
    if (!wallet) return { balanceKobo: 0, holdKobo: 0, ledger: [] };
    const ledger = await this.ledgerRepository.find({ where: { walletId: wallet.id }, order: { createdAt: 'DESC' }, take: 50 });
    return { balanceKobo: wallet.balanceKobo, holdKobo: wallet.heldKobo, ledger };
  }

  private async findUser(userId: string, repository = this.usersRepository) {
    const user = await repository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
