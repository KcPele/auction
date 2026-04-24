import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ListingAccessStatus } from '../../common/enums/listing-access-status.enum';
import { AccessCode } from '../admin/entities/access-code.entity';
import { ApplyListingAccessDto } from './dto/apply-listing-access.dto';
import { RedeemAccessCodeDto } from './dto/redeem-access-code.dto';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ListingAccessApplication } from './entities/listing-access-application.entity';
import { NotificationPreference } from './entities/notification-preference.entity';
import { UserListingPermission } from './entities/user-listing-permission.entity';
import { User } from './entities/user.entity';
import { presentUser } from './presenters/user.presenter';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepository: Repository<NotificationPreference>,
    @InjectRepository(ListingAccessApplication)
    private readonly applicationsRepository: Repository<ListingAccessApplication>,
    @InjectRepository(UserListingPermission)
    private readonly permissionsRepository: Repository<UserListingPermission>,
    @InjectRepository(AccessCode)
    private readonly accessCodesRepository: Repository<AccessCode>,
  ) {}

  async getMe(userId: string) {
    const user = await this.findActiveUser(userId);
    const preferences = await this.ensurePreferences(user.id);
    const permissions = await this.permissionsRepository.find({
      where: { userId: user.id },
      order: { createdAt: 'DESC' },
    });

    return {
      user: presentUser(user),
      notificationPreferences: preferences,
      listingPermissions: permissions,
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.findActiveUser(userId);

    if (dto.phone && dto.phone !== user.phone) {
      const existing = await this.usersRepository.findOneBy({
        phone: dto.phone,
      });

      if (existing) {
        throw new BadRequestException('Phone already exists');
      }
    }

    Object.assign(user, {
      firstName: dto.firstName?.trim() ?? user.firstName,
      lastName: dto.lastName?.trim() ?? user.lastName,
      phone: dto.phone ?? user.phone,
      nin: dto.nin ?? user.nin,
    });

    return { user: presentUser(await this.usersRepository.save(user)) };
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const preferences = await this.ensurePreferences(userId);

    Object.assign(preferences, {
      whatsappEnabled: dto.whatsappEnabled ?? preferences.whatsappEnabled,
      readyToBid: dto.readyToBid ?? preferences.readyToBid,
    });

    return {
      notificationPreferences:
        await this.preferencesRepository.save(preferences),
    };
  }

  async applyForListingAccess(userId: string, dto: ApplyListingAccessDto) {
    await this.findActiveUser(userId);

    const existingPermission = await this.permissionsRepository.findOneBy({
      userId,
      category: dto.category,
    });

    if (existingPermission) {
      throw new BadRequestException('Listing access already granted');
    }

    const pending = await this.applicationsRepository.findOneBy({
      userId,
      category: dto.category,
      status: ListingAccessStatus.Pending,
    });

    if (pending) {
      throw new BadRequestException('Application already pending');
    }

    const application = this.applicationsRepository.create({
      userId,
      category: dto.category,
      reason: dto.reason.trim(),
    });

    return {
      application: await this.applicationsRepository.save(application),
    };
  }

  async redeemAccessCode(userId: string, dto: RedeemAccessCodeDto) {
    await this.findActiveUser(userId);
    const accessCode = await this.accessCodesRepository.findOne({
      where: {
        code: dto.code.trim().toUpperCase(),
        isActive: true,
        usedAt: IsNull(),
      },
    });

    if (!accessCode || this.isExpired(accessCode.expiresAt)) {
      throw new BadRequestException('Invalid access code');
    }

    const existingPermission = await this.permissionsRepository.findOneBy({
      userId,
      category: accessCode.category,
    });

    if (existingPermission) {
      throw new BadRequestException('Listing access already granted');
    }

    const permission = await this.permissionsRepository.save(
      this.permissionsRepository.create({
        userId,
        category: accessCode.category,
        sourceCode: accessCode.code,
      }),
    );

    await this.accessCodesRepository.update(accessCode.id, {
      usedById: userId,
      usedAt: new Date(),
    });

    return { listingPermission: permission };
  }

  private async findActiveUser(userId: string) {
    const user = await this.usersRepository.findOneBy({
      id: userId,
      isActive: true,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  private async ensurePreferences(userId: string) {
    const existing = await this.preferencesRepository.findOneBy({ userId });

    if (existing) {
      return existing;
    }

    return this.preferencesRepository.save(
      this.preferencesRepository.create({ userId }),
    );
  }

  private isExpired(expiresAt: Date | null) {
    return Boolean(expiresAt && expiresAt.getTime() <= Date.now());
  }
}
