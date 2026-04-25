import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class ListNotificationLogsQueryDto {
  @ApiPropertyOptional({ description: 'Filter by channel' })
  @IsOptional()
  @IsString()
  channel?: string;

  @ApiPropertyOptional({ description: 'Filter by delivery status' })
  @IsOptional()
  @IsString()
  status?: string;
}
