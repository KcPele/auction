import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { AuctionSettlementService } from './auction-settlement.service';
import { AuctionsService } from './auctions.service';
import { CancelAuctionDto } from './dto/cancel-auction.dto';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';
import { UpdateDeliveryStatusDto } from './dto/update-delivery-status.dto';

@ApiTags('auctions')
@Controller('auctions')
export class AuctionsController {
  constructor(
    private readonly auctionsService: AuctionsService,
    private readonly auctionSettlementService: AuctionSettlementService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List auctions' })
  @ApiOkResponse({ description: 'Auctions returned.' })
  list(@Query() query: ListAuctionsQueryDto) {
    return this.auctionsService.list(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an auction by id' })
  @ApiOkResponse({ description: 'Auction returned.' })
  findOne(@Param('id') id: string) {
    return this.auctionsService.findOne(id);
  }

  @Get(':id/bids')
  @ApiOperation({ summary: 'List auction bids' })
  @ApiOkResponse({ description: 'Auction bids returned.' })
  listBids(@Param('id') id: string) {
    return this.auctionsService.listBids(id);
  }

  @Get(':id/payment-instructions')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get winner payment instructions' })
  @ApiOkResponse({ description: 'Payment instructions returned.' })
  getPaymentInstructions(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.auctionSettlementService.getPaymentInstructions(user, id);
  }

  @Post(':id/cancel')
  @ApiCookieAuth('better-auth.session_token')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Cancel a scheduled or live auction' })
  @ApiOkResponse({ description: 'Auction cancelled.' })
  @HttpCode(200)
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: CancelAuctionDto,
  ) {
    return this.auctionsService.cancel(user.id, id, dto);
  }

  @Post(':id/force-close')
  @ApiCookieAuth('better-auth.session_token')
  @Roles(UserRole.Admin)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({
    summary:
      'Admin: immediately close a live auction (skip remaining timer). Useful for ops intervention or finalising stuck auctions.',
  })
  @ApiOkResponse({ description: 'Auction closed.' })
  @HttpCode(200)
  forceClose(@Param('id') id: string) {
    return this.auctionsService.forceCloseAuction(id);
  }

  @Post(':id/confirm-payment')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Winner confirms they have made the payment' })
  @ApiOkResponse({ description: 'Payment confirmation sent.' })
  confirmPayment(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ConfirmPaymentDto,
  ) {
    return this.auctionSettlementService.confirmWinnerPayment(user, id, dto.note);
  }

  @Get(':id/delivery')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get delivery status for a settled auction' })
  @ApiOkResponse({ description: 'Delivery status returned.' })
  getDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.auctionSettlementService.getDeliveryStatus(user, id);
  }

  @Patch(':id/delivery')
  @ApiCookieAuth('better-auth.session_token')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update delivery status (seller or admin)' })
  @ApiOkResponse({ description: 'Delivery status updated.' })
  updateDelivery(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateDeliveryStatusDto,
  ) {
    return this.auctionSettlementService.updateDeliveryStatus(user, id, dto.status);
  }
}
