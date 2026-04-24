import { Body, Controller, Post } from '@nestjs/common';
import { ApiCreatedResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { OpayWebhookDto } from './dto/opay-webhook.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('opay/webhook')
  @ApiOperation({ summary: 'Receive an OPay webhook event' })
  @ApiCreatedResponse({ description: 'Webhook event accepted.' })
  handleOpayWebhook(@Body() dto: OpayWebhookDto) {
    return this.paymentsService.handleOpayWebhook(dto);
  }
}
