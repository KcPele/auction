import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('notification_preferences')
export class NotificationPreference {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => User, (user) => user.notificationPreference, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid', unique: true })
  userId!: string;

  @Column({ type: 'boolean', default: true })
  whatsappEnabled!: boolean;

  @Column({ type: 'boolean', default: false })
  readyToBid!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}

