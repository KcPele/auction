import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingAccessStatus } from '../../../common/enums/listing-access-status.enum';
import { ListingCategory } from '../../../common/enums/listing-category.enum';
import { User } from './user.entity';

@Entity('listing_access_applications')
export class ListingAccessApplication {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.listingAccessApplications, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: ListingCategory,
    enumName: 'listing_category_enum',
  })
  category!: ListingCategory;

  @Column({ type: 'text' })
  reason!: string;

  @Column({
    type: 'enum',
    enum: ListingAccessStatus,
    enumName: 'listing_access_status_enum',
    default: ListingAccessStatus.Pending,
  })
  status!: ListingAccessStatus;

  @Column({ type: 'uuid', nullable: true })
  reviewedById!: string | null;

  @Column({ type: 'text', nullable: true })
  reviewNote!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  reviewedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
