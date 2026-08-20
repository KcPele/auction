import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export type NotificationKindFilter =
  | 'bid'
  | 'listing'
  | 'payment'
  | 'system';

export class ListNotificationsQueryDto {
  @ApiPropertyOptional({ enum: ['bid', 'listing', 'payment', 'system'] })
  @IsOptional()
  @IsIn(['bid', 'listing', 'payment', 'system'])
  kind?: NotificationKindFilter;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(0)
  offset = 0;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  unreadOnly = false;
}
