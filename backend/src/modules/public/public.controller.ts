import { Controller, Get, Query } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
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

  @Get('stats')
  @ApiOperation({
    summary: 'Aggregate platform stats for the landing hero (public, no auth)',
  })
  @ApiOkResponse({ description: 'Platform stats returned.' })
  getStats() {
    return this.publicService.getStats();
  }

  @Get('category-stats')
  @ApiOperation({
    summary: 'Per-category live + settled counts and price range for landing',
  })
  @ApiOkResponse({ description: 'Category stats returned.' })
  getCategoryStats() {
    return this.publicService.getCategoryStats();
  }

  @Get('search')
  @ApiOperation({
    summary: 'Search auctions by make/model/year/brand (powers TopBar search)',
  })
  @ApiQuery({ name: 'q', required: true, type: String })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiOkResponse({ description: 'Matching auctions returned.' })
  search(@Query('q') q: string, @Query('limit') limit?: string) {
    const parsed = Number(limit);
    return this.publicService.search(
      q ?? '',
      Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 20) : 8,
    );
  }

  @Get('featured-auction')
  @ApiOperation({
    summary: 'Current featured live (or next scheduled) auction for the hero card',
  })
  @ApiOkResponse({ description: 'Featured auction returned.' })
  getFeaturedAuction() {
    return this.publicService.getFeaturedAuction();
  }
}
