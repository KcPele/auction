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
import { WalletWithdrawalStatus } from '../../../common/enums/wallet-withdrawal-status.enum';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';
import { Wallet } from './wallet.entity';

@Entity('wallet_withdrawals')
export class WalletWithdrawal {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
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
    enum: WalletWithdrawalStatus,
    enumName: 'wallet_withdrawal_status_enum',
    default: WalletWithdrawalStatus.Pending,
  })
  status!: WalletWithdrawalStatus;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    enumName: 'payment_provider_enum',
    default: PaymentProvider.Monnify,
  })
  provider!: PaymentProvider;

  @Column({ type: 'varchar', length: 128, unique: true })
  providerReference!: string;

  @Column({ type: 'varchar', length: 32 })
  destinationBankCode!: string;

  @Column({ type: 'varchar', length: 120 })
  destinationBankName!: string;

  @Column({ type: 'varchar', length: 32 })
  destinationAccountNumber!: string;

  @Column({ type: 'varchar', length: 160 })
  destinationAccountName!: string;

  @Column({ type: 'text', nullable: true })
  narration!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  providerPayload!: Record<string, unknown> | null;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  failedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
