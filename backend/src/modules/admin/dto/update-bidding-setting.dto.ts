import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Max, Min } from 'class-validator';

export class UpdateBiddingSettingDto {
  @ApiProperty({ example: 10 })
  @IsInt()
  @Min(1)
  @Max(100)
  bidRequirementPercent!: number;
}
