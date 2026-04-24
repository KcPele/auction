import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { WalletHoldStatus } from '../../../common/enums/wallet-hold-status.enum';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';
import { Wallet } from './wallet.entity';

@Entity('wallet_holds')
export class WalletHold {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  auctionId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  bidId!: string | null;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  amountKobo!: number;

  @Column({
    type: 'enum',
    enum: WalletHoldStatus,
    enumName: 'wallet_hold_status_enum',
    default: WalletHoldStatus.Active,
  })
  status!: WalletHoldStatus;

  @Column({ type: 'timestamptz', nullable: true })
  releasedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
