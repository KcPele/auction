import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity('notification_delivery_logs')
export class NotificationDeliveryLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 32 })
  channel!: string;

  @Column({ type: 'varchar', length: 160 })
  template!: string;

  @Column({ type: 'varchar', length: 255 })
  recipient!: string;

  @Column({ type: 'varchar', length: 32 })
  status!: string;

  @Column({ type: 'text', nullable: true })
  error!: string | null;

  @Column({ type: 'uuid', nullable: true })
  notificationId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
