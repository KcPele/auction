import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AuctionStatus } from '../../../common/enums/auction-status.enum';
import { ListingCategory } from '../../../common/enums/listing-category.enum';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';

@Entity('auctions')
export class Auction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({
    type: 'enum',
    enum: ListingCategory,
    enumName: 'listing_category_enum',
  })
  category!: ListingCategory;

  @Column({ type: 'uuid' })
  listingId!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  basePriceKobo!: number;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  minimumBidIncrementKobo!: number;

  @Column({ type: 'integer' })
  holdPercent!: number;

  @Column({ type: 'integer' })
  sellerFeeBps!: number;

  @Column({ type: 'integer' })
  buyerFeeBps!: number;

  @Column({ type: 'timestamptz' })
  startTime!: Date;

  @Column({ type: 'integer' })
  durationMinutes!: number;

  @Column({ type: 'timestamptz' })
  endTime!: Date;

  @Column({
    type: 'enum',
    enum: AuctionStatus,
    enumName: 'auction_status_enum',
    default: AuctionStatus.Scheduled,
  })
  status!: AuctionStatus;

  @Column({ type: 'uuid', nullable: true })
  currentWinningBidId!: string | null;

  @Column({ type: 'uuid', nullable: true })
  winnerId!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  paymentDeadlineAt!: Date | null;

  @Column({ type: 'bigint', nullable: true, transformer: bigintNumberTransformer })
  externalPaymentKobo!: number | null;

  @Column({ type: 'bigint', nullable: true, transformer: bigintNumberTransformer })
  walletPaymentKobo!: number | null;

  @Column({ type: 'uuid', nullable: true })
  settledById!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  settledAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  defaultedAt!: Date | null;

  @Column({ type: 'text', nullable: true })
  defaultReason!: string | null;

  @Column({ type: 'uuid', nullable: true })
  cancelledById!: string | null;

  @Column({ type: 'text', nullable: true })
  cancellationReason!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
