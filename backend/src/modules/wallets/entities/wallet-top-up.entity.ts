import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { PaymentProvider } from '../../../common/enums/payment-provider.enum';
import { TopUpStatus } from '../../../common/enums/top-up-status.enum';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';
import { Wallet } from './wallet.entity';

@Entity('wallet_top_ups')
export class WalletTopUp {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.topUps, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  amountKobo!: number;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency!: string;

  @Column({
    type: 'enum',
    enum: TopUpStatus,
    enumName: 'top_up_status_enum',
    default: TopUpStatus.Pending,
  })
  status!: TopUpStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    enumName: 'payment_provider_enum',
    default: PaymentProvider.Opay,
  })
  provider!: PaymentProvider;

  @Column({ type: 'varchar', length: 128, unique: true })
  providerReference!: string;

  @Column({ type: 'text', nullable: true })
  checkoutUrl!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  providerPayload!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  confirmedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
