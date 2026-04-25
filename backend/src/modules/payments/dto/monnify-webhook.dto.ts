import { Allow, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class MonnifyWebhookDto {
  @ApiProperty({ example: 'SUCCESSFUL_TRANSACTION' })
  @IsString()
  eventType!: string;

  @ApiProperty({ type: Object })
  @Allow()
  eventData!: Record<string, unknown>;
}
