import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brackets, Repository } from 'typeorm';
import { MechanicVerificationStatus } from '../../common/enums/mechanic-verification-status.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { ListMechanicsQueryDto } from './dto/list-mechanics-query.dto';
import { MechanicProfile } from './entities/mechanic-profile.entity';

@Injectable()
export class AdminMechanicsService {
  constructor(
    @InjectRepository(MechanicProfile) private readonly mechanicProfilesRepository: Repository<MechanicProfile>,
  ) {}

  async listMechanics(query: ListMechanicsQueryDto) {
    const qb = this.mechanicProfilesRepository.createQueryBuilder('mp').leftJoinAndSelect('mp.user', 'u').where('u.role = :role', { role: UserRole.Mechanic });

    if (query.search) {
      const term = `%${query.search}%`;
      qb.andWhere(new Brackets((b) => b.where('u.firstName ILIKE :term', { term }).orWhere('u.lastName ILIKE :term', { term }).orWhere('mp.shopName ILIKE :term', { term })));
    }
    if (query.status) qb.andWhere('mp.status = :status', { status: query.status });

    qb.orderBy('mp.createdAt', 'DESC');
    const profiles = await qb.getMany();

    return {
      items: profiles.map((mp) => ({
        id: mp.id, userId: mp.userId, name: `${mp.user.firstName} ${mp.user.lastName}`,
        shopName: mp.shopName, city: mp.city, inspectionCount: mp.inspectionCount,
        rating: mp.ratingCount > 0 ? Math.round((mp.ratingSum / mp.ratingCount) * 10) / 10 : 0,
        status: mp.status,
      })),
    };
  }

  async verifyMechanic(adminId: string, mechanicId: string) {
    const profile = await this.findMechanicProfile(mechanicId);
    if (profile.status === MechanicVerificationStatus.Verified) throw new BadRequestException('Mechanic is already verified');
    profile.status = MechanicVerificationStatus.Verified;
    profile.verifiedById = adminId;
    profile.verifiedAt = new Date();
    return { mechanic: await this.mechanicProfilesRepository.save(profile) };
  }

  async revokeMechanic(mechanicId: string) {
    const profile = await this.findMechanicProfile(mechanicId);
    if (profile.status === MechanicVerificationStatus.Revoked) throw new BadRequestException('Mechanic verification is already revoked');
    profile.status = MechanicVerificationStatus.Revoked;
    profile.verifiedById = null;
    profile.verifiedAt = null;
    return { mechanic: await this.mechanicProfilesRepository.save(profile) };
  }

  private async findMechanicProfile(mechanicId: string) {
    const profile = await this.mechanicProfilesRepository.findOneBy({ id: mechanicId });
    if (!profile) throw new NotFoundException('Mechanic profile not found');
    return profile;
  }
}
