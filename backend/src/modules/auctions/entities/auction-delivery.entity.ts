import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum';
import { Auction } from '../../auctions/entities/auction.entity';

@Entity('auction_deliveries')
export class AuctionDelivery {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @OneToOne(() => Auction, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'auctionId' })
  auction!: Auction;

  @Column({ type: 'uuid', unique: true })
  auctionId!: string;

  @Column({ type: 'uuid' })
  winnerId!: string;

  @Column({ type: 'uuid' })
  sellerId!: string;

  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    enumName: 'delivery_status_enum',
    default: DeliveryStatus.PaymentConfirmed,
  })
  status!: DeliveryStatus;

  @Column({ type: 'text', nullable: true })
  trackingInfo!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
