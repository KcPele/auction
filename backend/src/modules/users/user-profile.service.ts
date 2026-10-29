import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { AuthUserSyncService } from '../../common/services/auth-user-sync.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { User } from './entities/user.entity';
import { presentUser } from './presenters/user.presenter';

@Injectable()
export class UserProfileService {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly authUserSync: AuthUserSyncService,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const firstName = dto.firstName?.trim();
    const lastName = dto.lastName?.trim();
    const phone = dto.phone?.trim();

    if (dto.firstName !== undefined && !firstName) {
      throw new BadRequestException('First name is required');
    }
    if (dto.lastName !== undefined && !lastName) {
      throw new BadRequestException('Last name is required');
    }

    return this.dataSource.transaction(async (manager) => {
      const users = manager.getRepository(User);
      const user = await users.findOneBy({ id: userId, isActive: true });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      if (phone && phone !== user.phone) {
        const taken = await this.authUserSync.isPhoneTaken(
          manager,
          phone,
          userId,
        );

        if (taken) {
          throw new BadRequestException('Phone already exists');
        }
      }

      Object.assign(user, {
        firstName: firstName ?? user.firstName,
        lastName: lastName ?? user.lastName,
        phone: phone ?? user.phone,
      });

      const saved = await users.save(user);
      await this.authUserSync.syncProfile(manager, userId, {
        firstName: saved.firstName,
        lastName: saved.lastName,
        phone: saved.phone,
      });

      return { user: presentUser(saved) };
    });
  }
}
