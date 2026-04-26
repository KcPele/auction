import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { DeliveryStatus } from '../../../common/enums/delivery-status.enum';

export class UpdateDeliveryStatusDto {
  @ApiProperty({ enum: DeliveryStatus, example: DeliveryStatus.SellerShips })
  @IsEnum(DeliveryStatus)
  status!: DeliveryStatus;
}
