import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
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
import { ListAuctionsQueryDto } from './dto/list-auctions-query.dto';

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
}
