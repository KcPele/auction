import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ListRecentBidsQueryDto } from './dto/list-recent-bids-query.dto';
import { PublicService } from './public.service';

@ApiTags('public')
@Controller('public')
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get('recent-bids')
  @ApiOperation({
    summary:
      'Latest bids across all auctions (public, no auth) — powers the landing ticker',
  })
  @ApiOkResponse({ description: 'Recent bids returned.' })
  listRecentBids(@Query() query: ListRecentBidsQueryDto) {
    return this.publicService.listRecentBids(query.limit);
  }
}
