import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { Wallet } from '../wallets/entities/wallet.entity';
import { WalletLedgerEntry } from '../wallets/entities/wallet-ledger-entry.entity';
import { BanUserDto } from './dto/ban-user.dto';
import { ListAdminUsersQueryDto } from './dto/list-admin-users-query.dto';
import { Brackets } from 'typeorm';

@Injectable()
export class AdminUsersService {
  constructor(
    @InjectRepository(User) private readonly usersRepository: Repository<User>,
    @InjectRepository(Wallet) private readonly walletsRepository: Repository<Wallet>,
    @InjectRepository(WalletLedgerEntry) private readonly ledgerRepository: Repository<WalletLedgerEntry>,
  ) {}

  async listUsers(query: ListAdminUsersQueryDto) {
    const qb = this.usersRepository.createQueryBuilder('u').leftJoinAndSelect('u.notificationPreference', 'np');

    if (query.search) {
      const term = `%${query.search}%`;
      qb.andWhere(new Brackets((b) => b.where('u.firstName ILIKE :term', { term }).orWhere('u.lastName ILIKE :term', { term }).orWhere('u.email ILIKE :term', { term }).orWhere('u.phone ILIKE :term', { term })));
    }

    if (query.status === 'active') qb.andWhere('u.isActive = true AND u.isBanned = false');
    else if (query.status === 'banned') qb.andWhere('u.isBanned = true');

    qb.orderBy('u.createdAt', 'DESC').take(query.limit).skip(query.offset);
    const [users, total] = await qb.getManyAndCount();

    const userIds = users.map((u) => u.id);
    const wallets = userIds.length > 0 ? await this.walletsRepository.find({ where: { userId: In(userIds) } }) : [];
    const walletMap = new Map(wallets.map((w) => [w.userId, w]));

    const items = users.map((u) => {
      const wallet = walletMap.get(u.id);
      return {
        id: u.id, handle: `@${u.firstName.toLowerCase()}***`, firstName: u.firstName, lastName: u.lastName,
        email: u.email, phone: u.phone, role: u.role, isActive: u.isActive, isBanned: u.isBanned,
        walletBalanceKobo: wallet?.balanceKobo ?? 0, walletHoldKobo: wallet?.heldKobo ?? 0, createdAt: u.createdAt,
      };
    });

    return { items, total };
  }

  async banUser(userId: string, dto: BanUserDto) {
    const user = await this.findUser(userId);
    if (user.isBanned) throw new BadRequestException('User is already banned');
    user.isBanned = true;
    user.banReason = dto.reason.trim();
    user.bannedAt = new Date();
    return { user: await this.usersRepository.save(user) };
  }

  async unbanUser(userId: string) {
    const user = await this.findUser(userId);
    if (!user.isBanned) throw new BadRequestException('User is not banned');
    user.isBanned = false;
    user.banReason = null;
    user.bannedAt = null;
    return { user: await this.usersRepository.save(user) };
  }

  async getUserWallet(userId: string) {
    const user = await this.findUser(userId);
    const wallet = await this.walletsRepository.findOneBy({ userId: user.id });
    if (!wallet) return { balanceKobo: 0, holdKobo: 0, ledger: [] };
    const ledger = await this.ledgerRepository.find({ where: { walletId: wallet.id }, order: { createdAt: 'DESC' }, take: 50 });
    return { balanceKobo: wallet.balanceKobo, holdKobo: wallet.heldKobo, ledger };
  }

  private async findUser(userId: string) {
    const user = await this.usersRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }
}
