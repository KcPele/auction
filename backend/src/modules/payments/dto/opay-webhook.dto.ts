import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';

const opayWebhookStatuses = ['SUCCESS', 'FAILED', 'PENDING'] as const;

export class OpayWebhookDto {
  @ApiProperty({ example: 'opay-event-123' })
  @IsString()
  eventId!: string;

  @ApiProperty({ example: 'PAYMENT_SUCCESS' })
  @IsString()
  eventType!: string;

  @ApiProperty({ example: 'wallet_topup_123' })
  @IsString()
  providerReference!: string;

  @ApiProperty({ enum: opayWebhookStatuses, example: 'SUCCESS' })
  @IsIn(opayWebhookStatuses)
  status!: (typeof opayWebhookStatuses)[number];

  @ApiPropertyOptional({ example: 'testing webhook locally' })
  @IsOptional()
  @IsString()
  message?: string;
}
