import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

@Entity('platform_fee_settings')
export class PlatformFeeSetting {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ListingCategory,
    enumName: 'listing_category_enum',
    unique: true,
  })
  category!: ListingCategory;

  @Column({ type: 'integer' })
  sellerFeeBps!: number;

  @Column({ type: 'integer' })
  buyerFeeBps!: number;

  @Column({ type: 'uuid', nullable: true })
  updatedById!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
