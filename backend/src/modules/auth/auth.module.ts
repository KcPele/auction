import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationPreference } from '../users/entities/notification-preference.entity';
import { User } from '../users/entities/user.entity';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { MechanicProfile } from '../admin/entities/mechanic-profile.entity';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      NotificationPreference,
      RefreshToken,
      MechanicProfile,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule {}
