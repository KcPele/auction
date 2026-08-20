import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, MaxLength, MinLength } from 'class-validator';

export class CreateDisputeDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  auctionId!: string;

  @ApiProperty({ example: 'The delivered vehicle does not match the listing.' })
  @IsString()
  @MinLength(10)
  @MaxLength(1000)
  reason!: string;
}
