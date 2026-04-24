import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { WalletLedgerType } from '../../../common/enums/wallet-ledger-type.enum';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';
import { Wallet } from './wallet.entity';

@Entity('wallet_ledger_entries')
export class WalletLedgerEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  walletId!: string;

  @ManyToOne(() => Wallet, (wallet) => wallet.ledgerEntries, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'walletId' })
  wallet!: Wallet;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: WalletLedgerType,
    enumName: 'wallet_ledger_type_enum',
  })
  type!: WalletLedgerType;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  amountKobo!: number;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  balanceBeforeKobo!: number;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  balanceAfterKobo!: number;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  heldBeforeKobo!: number;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  heldAfterKobo!: number;

  @Column({ type: 'varchar', length: 128, nullable: true })
  reference!: string | null;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
