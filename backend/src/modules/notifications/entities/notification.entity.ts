import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { NotificationAudience } from '../../../common/enums/notification-audience.enum';
import { NotificationType } from '../../../common/enums/notification-type.enum';
import { User } from '../../users/entities/user.entity';
import { NotificationRead } from './notification-read.entity';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: NotificationAudience,
    enumName: 'notification_audience_enum',
  })
  audience!: NotificationAudience;

  @Column({ type: 'uuid', nullable: true })
  recipientId!: string | null;

  @ManyToOne(() => User, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipientId' })
  recipient!: User | null;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'notification_type_enum',
  })
  type!: NotificationType;

  @Column({ type: 'varchar', length: 160 })
  title!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ type: 'jsonb', nullable: true })
  data!: Record<string, unknown> | null;

  @OneToMany(() => NotificationRead, (read) => read.notification)
  reads!: NotificationRead[];

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
