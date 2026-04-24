import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { BidsService } from './bids.service';
import { PlaceBidDto } from './dto/place-bid.dto';

@ApiTags('bids')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('auctions/:auctionId/bids')
export class BidsController {
  constructor(private readonly bidsService: BidsService) {}

  @Post()
  @ApiOperation({ summary: 'Place a wallet-backed bid on a live auction' })
  @ApiCreatedResponse({ description: 'Bid accepted.' })
  placeBid(
    @CurrentUser() user: AuthenticatedUser,
    @Param('auctionId') auctionId: string,
    @Body() dto: PlaceBidDto,
  ) {
    return this.bidsService.placeBid(user.id, auctionId, dto);
  }
}
