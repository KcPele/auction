import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateGadgetListingDto } from './dto/create-gadget-listing.dto';
import { UpdateGadgetListingDto } from './dto/update-gadget-listing.dto';
import { GadgetsService } from './gadgets.service';

@ApiTags('gadgets')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('gadgets')
export class GadgetsController {
  constructor(private readonly gadgetsService: GadgetsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft gadget listing' })
  @ApiCreatedResponse({ description: 'Draft gadget listing created.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateGadgetListingDto,
  ) {
    return this.gadgetsService.create(user.id, dto);
  }

  @Get('my-listings')
  @ApiOperation({ summary: 'List current user gadget listings' })
  @ApiOkResponse({ description: 'Gadget listings returned.' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.gadgetsService.listMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a gadget listing by ID' })
  @ApiOkResponse({ description: 'Gadget listing returned.' })
  findOne(@Param('id') id: string) {
    return this.gadgetsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft gadget listing' })
  @ApiOkResponse({ description: 'Draft gadget listing updated.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateGadgetListingDto,
  ) {
    return this.gadgetsService.update(user.id, id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft gadget listing for admin review' })
  @ApiCreatedResponse({ description: 'Gadget listing submitted.' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.gadgetsService.submit(user.id, id);
  }
}
