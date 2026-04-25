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
import { WalletFundingAccountStatus } from '../../../common/enums/wallet-funding-account-status.enum';
import { Wallet } from './wallet.entity';

@Entity('wallet_funding_accounts')
export class WalletFundingAccount {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    enumName: 'payment_provider_enum',
    default: PaymentProvider.Monnify,
  })
  provider!: PaymentProvider;

  @Column({ type: 'varchar', length: 128, unique: true })
  accountReference!: string;

  @Column({ type: 'varchar', length: 64 })
  accountNumber!: string;

  @Column({ type: 'varchar', length: 160 })
  accountName!: string;

  @Column({ type: 'varchar', length: 120 })
  bankName!: string;

  @Column({ type: 'varchar', length: 32, nullable: true })
  bankCode!: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  reservationReference!: string | null;

  @Column({
    type: 'enum',
    enum: WalletFundingAccountStatus,
    enumName: 'wallet_funding_account_status_enum',
    default: WalletFundingAccountStatus.Active,
  })
  status!: WalletFundingAccountStatus;

  @Column({ type: 'jsonb', nullable: true })
  providerPayload!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
