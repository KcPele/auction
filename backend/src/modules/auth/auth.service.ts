import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { JwtSignOptions } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import * as argon2 from 'argon2';
import { IsNull, MoreThan, Repository } from 'typeorm';
import { UserRole } from '../../common/enums/user-role.enum';
import { NotificationPreference } from '../users/entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { presentUser } from '../users/presenters/user.presenter';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterDto } from './dto/register.dto';
import { RefreshToken } from './entities/refresh-token.entity';
import { AuthTokenPayload } from './types/auth-token-payload';
import { parseTokenDuration } from './utils/token-duration.util';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(NotificationPreference)
    private readonly preferencesRepository: Repository<NotificationPreference>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokensRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.role === UserRole.Admin) {
      throw new BadRequestException('Admin users cannot self-register');
    }

    const email = dto.email.toLowerCase().trim();
    await this.ensureUniqueIdentity(email, dto.phone);

    const user = this.usersRepository.create({
      email,
      phone: dto.phone,
      passwordHash: await argon2.hash(dto.password),
      firstName: dto.firstName.trim(),
      lastName: dto.lastName.trim(),
      role: dto.role ?? UserRole.IndividualBidder,
      nin: dto.nin ?? null,
    });
    const savedUser = await this.usersRepository.save(user);

    await this.preferencesRepository.save(
      this.preferencesRepository.create({ userId: savedUser.id }),
    );

    return this.buildAuthResponse(savedUser);
  }

  async login(dto: LoginDto) {
    const user = await this.usersRepository.findOne({
      where: { email: dto.email.toLowerCase().trim(), isActive: true },
    });

    if (!user || !(await argon2.verify(user.passwordHash, dto.password))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    return this.buildAuthResponse(user);
  }

  async refresh(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const tokenRecord = await this.findMatchingRefreshToken(
      payload.sub,
      dto.refreshToken,
    );

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.refreshTokensRepository.update(tokenRecord.id, {
      revokedAt: new Date(),
    });

    const user = await this.usersRepository.findOneByOrFail({
      id: payload.sub,
    });

    return this.buildAuthResponse(user);
  }

  async logout(dto: RefreshTokenDto) {
    const payload = await this.verifyRefreshToken(dto.refreshToken);
    const tokenRecord = await this.findMatchingRefreshToken(
      payload.sub,
      dto.refreshToken,
    );

    if (tokenRecord) {
      await this.refreshTokensRepository.update(tokenRecord.id, {
        revokedAt: new Date(),
      });
    }

    return { success: true };
  }

  private async ensureUniqueIdentity(email: string, phone: string) {
    const existing = await this.usersRepository.findOne({
      where: [{ email }, { phone }],
    });

    if (existing) {
      throw new BadRequestException('Email or phone already exists');
    }
  }

  private async buildAuthResponse(user: User) {
    const payload: AuthTokenPayload = {
      sub: user.id,
      role: user.role,
    };
    const accessTtl = this.config.getOrThrow<string>(
      'JWT_ACCESS_TTL',
    ) as JwtSignOptions['expiresIn'];
    const refreshTtl = this.config.getOrThrow<string>(
      'JWT_REFRESH_TTL',
    ) as JwtSignOptions['expiresIn'];
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_ACCESS_SECRET'),
      expiresIn: accessTtl,
    });
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: refreshTtl,
    });

    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: presentUser(user),
      accessToken,
      refreshToken,
    };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const ttl = this.config.getOrThrow<string>('JWT_REFRESH_TTL');
    const expiresAt = new Date(Date.now() + parseTokenDuration(ttl));

    await this.refreshTokensRepository.save(
      this.refreshTokensRepository.create({
        userId,
        tokenHash: await argon2.hash(refreshToken),
        expiresAt,
        revokedAt: null,
      }),
    );
  }

  private async verifyRefreshToken(refreshToken: string) {
    try {
      return await this.jwtService.verifyAsync<AuthTokenPayload>(refreshToken, {
        secret: this.config.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async findMatchingRefreshToken(userId: string, refreshToken: string) {
    const tokenRecords = await this.refreshTokensRepository.find({
      where: {
        userId,
        revokedAt: IsNull(),
        expiresAt: MoreThan(new Date()),
      },
      order: { createdAt: 'DESC' },
      take: 10,
    });

    for (const tokenRecord of tokenRecords) {
      if (await argon2.verify(tokenRecord.tokenHash, refreshToken)) {
        return tokenRecord;
      }
    }

    return null;
  }
}
