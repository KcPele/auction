import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BidStatus } from '../../../common/enums/bid-status.enum';
import { bigintNumberTransformer } from '../../../common/transformers/bigint-number.transformer';
import { Auction } from '../../auctions/entities/auction.entity';

@Entity('bids')
export class Bid {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  auctionId!: string;

  @ManyToOne(() => Auction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auctionId' })
  auction!: Auction;

  @Column({ type: 'uuid' })
  bidderId!: string;

  @Column({ type: 'bigint', transformer: bigintNumberTransformer })
  amountKobo!: number;

  @Column({ type: 'uuid', nullable: true })
  walletHoldId!: string | null;

  @Column({
    type: 'enum',
    enum: BidStatus,
    enumName: 'bid_status_enum',
    default: BidStatus.Accepted,
  })
  status!: BidStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
