import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('platform_toggles')
export class PlatformToggle {
  @PrimaryColumn({ type: 'varchar', length: 32 })
  id!: string;

  @Column({ type: 'boolean', default: true })
  emailNotifications!: boolean;

  @Column({ type: 'boolean', default: true })
  whatsappNotifications!: boolean;

  @Column({ type: 'boolean', default: false })
  pauseNewListings!: boolean;

  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
