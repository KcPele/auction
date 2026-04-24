import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '../../../common/enums/user-role.enum';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';
import { ListingAccessApplication } from './listing-access-application.entity';
import { NotificationPreference } from './notification-preference.entity';
import { UserListingPermission } from './user-listing-permission.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 32, unique: true })
  phone!: string;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 100 })
  firstName!: string;

  @Column({ type: 'varchar', length: 100 })
  lastName!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'users_role_enum',
    default: UserRole.IndividualBidder,
  })
  role!: UserRole;

  @Column({ type: 'varchar', length: 32, nullable: true })
  nin!: string | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user)
  refreshTokens!: RefreshToken[];

  @OneToOne(() => NotificationPreference, (preference) => preference.user)
  notificationPreference!: NotificationPreference;

  @OneToMany(() => UserListingPermission, (permission) => permission.user)
  listingPermissions!: UserListingPermission[];

  @OneToMany(() => ListingAccessApplication, (application) => application.user)
  listingAccessApplications!: ListingAccessApplication[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
