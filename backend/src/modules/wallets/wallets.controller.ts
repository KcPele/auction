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
import { CreateWithdrawalDto } from './dto/create-withdrawal.dto';
import { InitiateTopupDto } from './dto/initiate-topup.dto';
import { ListWalletLedgerQueryDto } from './dto/list-wallet-ledger-query.dto';
import { ListWithdrawalsQueryDto } from './dto/list-withdrawals-query.dto';
import { WalletFundingService } from './wallet-funding.service';
import { WalletWithdrawalsService } from './wallet-withdrawals.service';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(
    private readonly walletsService: WalletsService,
    private readonly walletFundingService: WalletFundingService,
    private readonly walletWithdrawalsService: WalletWithdrawalsService,
  ) {}

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

  @Get('me/withdrawals')
  @ApiOperation({ summary: 'List current user withdrawals' })
  @ApiOkResponse({ description: 'Withdrawals returned.' })
  listWithdrawals(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListWithdrawalsQueryDto,
  ) {
    return this.walletWithdrawalsService.listUserWithdrawals(user.id, query);
  }

  @Post('funding-account')
  @ApiOperation({ summary: 'Create or return a Strowallet funding account' })
  @ApiCreatedResponse({ description: 'Funding account returned.' })
  getFundingAccount(@CurrentUser() user: AuthenticatedUser) {
    return this.walletFundingService.getFundingAccount(user.id);
  }

  @Post('topup/initiate')
  @ApiOperation({ summary: 'Initiate a wallet top-up' })
  @ApiCreatedResponse({ description: 'Top-up details returned.' })
  initiateTopup(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: InitiateTopupDto,
  ) {
    return this.walletFundingService.initiateTopup(user.id, dto);
  }

  @Post('withdrawals')
  @ApiOperation({ summary: 'Withdraw available wallet balance' })
  @ApiCreatedResponse({ description: 'Withdrawal initiated.' })
  createWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateWithdrawalDto,
  ) {
    return this.walletWithdrawalsService.createWithdrawal(user.id, dto);
  }

  @Get('withdrawals/:id')
  @ApiOperation({ summary: 'Get a wallet withdrawal by id' })
  @ApiOkResponse({ description: 'Withdrawal returned.' })
  getWithdrawal(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.walletWithdrawalsService.getWithdrawal(user.id, id);
  }
}
