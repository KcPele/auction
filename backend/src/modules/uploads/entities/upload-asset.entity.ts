import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ListingCategory } from '../../../common/enums/listing-category.enum';
import { UploadPurpose } from '../../../common/enums/upload-purpose.enum';
import { UploadResourceType } from '../../../common/enums/upload-resource-type.enum';
import { User } from '../../users/entities/user.entity';

@Entity('upload_assets')
export class UploadAsset {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  ownerId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  owner!: User;

  @Column({ type: 'enum', enum: UploadPurpose, enumName: 'upload_purpose_enum' })
  purpose!: UploadPurpose;

  @Column({
    type: 'enum',
    enum: ListingCategory,
    enumName: 'listing_category_enum',
    nullable: true,
  })
  category!: ListingCategory | null;

  @Column({
    type: 'enum',
    enum: UploadResourceType,
    enumName: 'upload_resource_type_enum',
  })
  resourceType!: UploadResourceType;

  @Column({ type: 'varchar', length: 255 })
  originalName!: string;

  @Column({ type: 'varchar', length: 120 })
  mimeType!: string;

  @Column({ type: 'integer' })
  sizeBytes!: number;

  @Column({ type: 'varchar', length: 32 })
  provider!: string;

  @Column({ type: 'varchar', length: 255 })
  providerPublicId!: string;

  @Column({ type: 'text' })
  url!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
