import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingStatus } from '../../../common/enums/listing-status.enum';

@Entity('gadget_listings')
export class GadgetListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listerId!: string;

  @Column({ type: 'varchar', length: 100 })
  type!: string;

  @Column({ type: 'varchar', length: 100 })
  brand!: string;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'varchar', length: 50 })
  colour!: string;

  @Column({ type: 'integer', nullable: true })
  batteryHealthPercent!: number | null;

  @Column({ type: 'jsonb', default: () => "'{}'" })
  specs!: Record<string, string>;

  @Column({ type: 'text' })
  usageHistory!: string;

  @Column({ type: 'text', nullable: true })
  defects!: string | null;

  @Column({ type: 'varchar', length: 500 })
  proofDocumentUrl!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  photoUrls!: string[];

  @Column({ type: 'jsonb', default: () => "'[]'" })
  videoUrls!: string[];

  @Column({ type: 'bigint' })
  basePriceKobo!: string;

  @Column({ type: 'integer' })
  holdPercent!: number;

  @Column({ type: 'bigint' })
  minimumBidIncrementKobo!: string;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'integer' })
  durationMinutes!: number;

  @Column({
    type: 'enum',
    enum: ListingStatus,
    enumName: 'listing_status_enum',
    default: ListingStatus.Draft,
  })
  status!: ListingStatus;

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

