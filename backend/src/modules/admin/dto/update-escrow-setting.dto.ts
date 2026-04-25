import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, Min } from 'class-validator';

export class UpdateEscrowSettingDto {
  @ApiPropertyOptional({ example: 1000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  minHoldBps?: number;

  @ApiPropertyOptional({ example: 2000 })
  @IsOptional()
  @IsInt()
  @Min(0)
  maxHoldBps?: number;

  @ApiPropertyOptional({ example: 24 })
  @IsOptional()
  @IsInt()
  @Min(1)
  paymentWindowHours?: number;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  autoExtendMinutes?: number;
}
