import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ListingStatus } from '../../../common/enums/listing-status.enum';

@Entity('car_listings')
export class CarListing {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  listerId!: string;

  @Column({ type: 'varchar', length: 100 })
  make!: string;

  @Column({ type: 'varchar', length: 100 })
  model!: string;

  @Column({ type: 'integer' })
  year!: number;

  @Column({ type: 'varchar', length: 50 })
  colour!: string;

  @Column({ type: 'varchar', length: 50 })
  registrationNumber!: string;

  @Column({ type: 'integer' })
  mileage!: number;

  @Column({ type: 'varchar', length: 100 })
  condition!: string;

  @Column({ type: 'text', nullable: true })
  knownFaults!: string | null;

  @Column({ type: 'uuid', nullable: true })
  mechanicId!: string | null;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  photoUrls!: string[];

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

