import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

@Entity('access_codes')
export class AccessCode {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 64, unique: true })
  code!: string;

  @Column({
    type: 'enum',
    enum: ListingCategory,
    enumName: 'listing_category_enum',
  })
  category!: ListingCategory;

  @Column({ type: 'uuid' })
  createdById!: string;

  @Column({ type: 'uuid', nullable: true })
  usedById!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  usedAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
