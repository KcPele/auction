import { Body, Controller, Get, Post, Query, Req, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountNameQueryDto } from './dto/account-name-query.dto';
import { StrowalletWebhookDto } from './dto/strowallet-webhook.dto';
import { PaymentsService } from './payments.service';

type RawBodyRequest = {
  rawBody?: Buffer | string;
};

@ApiTags('payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('strowallet/webhook')
  @ApiOperation({ summary: 'Receive a Strowallet webhook event' })
  @ApiCreatedResponse({ description: 'Webhook event accepted.' })
  handleStrowalletWebhook(
    @Body() dto: StrowalletWebhookDto,
    @Req() request: RawBodyRequest,
  ) {
    const rawPayload =
      typeof request.rawBody === 'string'
        ? request.rawBody
        : request.rawBody?.toString('utf8') ?? JSON.stringify(dto);

    return this.paymentsService.handleStrowalletWebhook(dto, rawPayload);
  }

  @Get('banks')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List Strowallet-supported banks' })
  @ApiOkResponse({ description: 'Banks returned.' })
  listBanks() {
    return this.paymentsService.listBanks();
  }

  @Get('banks/account-name')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Resolve a bank account name with Strowallet' })
  @ApiOkResponse({ description: 'Account name returned.' })
  getAccountName(@Query() query: AccountNameQueryDto) {
    return this.paymentsService.getAccountName(query);
  }
}
