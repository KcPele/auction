import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { ListingCategory } from '../../../common/enums/listing-category.enum';
import { User } from './user.entity';

@Entity('user_listing_permissions')
@Unique(['userId', 'category'])
export class UserListingPermission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.listingPermissions, {
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

  @Column({ type: 'uuid', nullable: true })
  grantedById!: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  sourceCode!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
