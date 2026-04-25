import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('escrow_settings')
export class EscrowSetting {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'integer', default: 1000 })
  minHoldBps!: number;

  @Column({ type: 'integer', default: 2000 })
  maxHoldBps!: number;

  @Column({ type: 'integer', default: 24 })
  paymentWindowHours!: number;

  @Column({ type: 'integer', default: 0 })
  autoExtendMinutes!: number;

  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
