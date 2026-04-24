import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateTopUpDto } from './dto/create-top-up.dto';
import { ListWalletLedgerQueryDto } from './dto/list-wallet-ledger-query.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user wallet balance' })
  @ApiOkResponse({ description: 'Wallet balance returned.' })
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.walletsService.getWallet(user.id);
  }

  @Get('me/ledger')
  @ApiOperation({ summary: 'List current user wallet ledger entries' })
  @ApiOkResponse({ description: 'Wallet ledger entries returned.' })
  listLedger(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListWalletLedgerQueryDto,
  ) {
    return this.walletsService.listLedger(user.id, query);
  }

  @Post('top-ups')
  @ApiOperation({ summary: 'Create a wallet top-up session' })
  @ApiCreatedResponse({ description: 'Top-up session created.' })
  createTopUp(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateTopUpDto,
  ) {
    return this.walletsService.createTopUp(user.id, dto);
  }

  @Get('top-ups/:id')
  @ApiOperation({ summary: 'Get a wallet top-up by id' })
  @ApiOkResponse({ description: 'Top-up returned.' })
  getTopUp(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.walletsService.getTopUp(user.id, id);
  }
}
