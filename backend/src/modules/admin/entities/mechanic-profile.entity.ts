import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { MechanicVerificationStatus } from '../../../common/enums/mechanic-verification-status.enum';
import { User } from '../../users/entities/user.entity';

@Entity('mechanic_profiles')
export class MechanicProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'varchar', length: 160, nullable: true })
  shopName!: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city!: string | null;

  @Column({
    type: 'enum',
    enum: MechanicVerificationStatus,
    enumName: 'mechanic_verification_status_enum',
    default: MechanicVerificationStatus.Pending,
  })
  status!: MechanicVerificationStatus;

  @Column({ type: 'integer', default: 0 })
  inspectionCount!: number;

  @Column({ type: 'integer', default: 0 })
  ratingSum!: number;

  @Column({ type: 'integer', default: 0 })
  ratingCount!: number;

  @Column({ type: 'uuid', nullable: true })
  verifiedById!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
