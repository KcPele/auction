import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('kyc_profiles')
export class KycProfile {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'timestamptz', nullable: true })
  bvnVerifiedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  phoneVerifiedAt!: Date | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  pendingBvnTransactionId!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  pendingBvnHash!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  verifiedBvnHash!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  strowalletSubaccountId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
