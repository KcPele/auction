import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';
import { User } from '../../users/entities/user.entity';
import { WalletLedgerEntry } from './wallet-ledger-entry.entity';
import { WalletTopUp } from './wallet-top-up.entity';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'varchar', length: 3, default: 'NGN' })
  currency!: string;

  @Column({ type: 'bigint', default: 0, transformer: bigintNumberTransformer })
  balanceKobo!: number;

  @Column({ type: 'bigint', default: 0, transformer: bigintNumberTransformer })
  heldKobo!: number;

  @OneToMany(() => WalletLedgerEntry, (entry) => entry.wallet)
  ledgerEntries!: WalletLedgerEntry[];

  @OneToMany(() => WalletTopUp, (topUp) => topUp.wallet)
  topUps!: WalletTopUp[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
