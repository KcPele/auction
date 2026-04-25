import { Body, Controller, Headers, Post, Req } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MonnifyWebhookDto } from './dto/monnify-webhook.dto';
import { PaymentsService } from './payments.service';

type RawBodyRequest = {
  rawBody?: Buffer | string;
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('monnify/webhook')
  @ApiOperation({ summary: 'Receive a Monnify webhook event' })
  @ApiCreatedResponse({ description: 'Webhook event accepted.' })
  handleMonnifyWebhook(
    @Body() dto: MonnifyWebhookDto,
    @Headers('monnify-signature') signature: string | undefined,
    @Req() request: RawBodyRequest,
  ) {
    const rawPayload =
      typeof request.rawBody === 'string'
        ? request.rawBody
        : request.rawBody?.toString('utf8') ?? JSON.stringify(dto);

    return this.paymentsService.handleMonnifyWebhook(
      dto,
      signature,
      rawPayload,
    );
  }
}
