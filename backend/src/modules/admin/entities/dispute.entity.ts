import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DisputeStatus } from '../../../common/enums/dispute-status.enum';

@Entity('disputes')
export class Dispute {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  auctionId!: string;

  @Column({ type: 'uuid' })
  buyerId!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @Column({ type: 'bigint' })
  amountKobo!: string;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: DisputeStatus,
    enumName: 'dispute_status_enum',
    default: DisputeStatus.Open,
  })
  status!: DisputeStatus;

  @Column({ type: 'text', nullable: true })
  resolution!: string | null;

  @Column({ type: 'uuid', nullable: true })
  resolvedById!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
