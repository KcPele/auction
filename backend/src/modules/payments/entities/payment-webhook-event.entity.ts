import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentProvider } from '../../../common/enums/payment-provider.enum';

@Entity('payment_webhook_events')
export class PaymentWebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: PaymentProvider,
    enumName: 'payment_provider_enum',
  })
  provider!: PaymentProvider;

  @Column({ type: 'varchar', length: 160, unique: true })
  eventId!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  eventType!: string | null;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @Column({ type: 'timestamptz', nullable: true })
  processedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
