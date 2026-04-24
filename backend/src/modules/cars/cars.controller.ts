import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiCookieAuth, ApiCreatedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CarsService } from './cars.service';
import { CreateCarListingDto } from './dto/create-car-listing.dto';
import { UpdateCarListingDto } from './dto/update-car-listing.dto';

@ApiTags('cars')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('cars')
export class CarsController {
  constructor(private readonly carsService: CarsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a draft car listing' })
  @ApiCreatedResponse({ description: 'Draft car listing created.' })
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateCarListingDto) {
    return this.carsService.create(user.id, dto);
  }

  @Get('my-listings')
  @ApiOperation({ summary: 'List current user car listings' })
  @ApiOkResponse({ description: 'Car listings returned.' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.carsService.listMine(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a car listing by ID' })
  @ApiOkResponse({ description: 'Car listing returned.' })
  findOne(@Param('id') id: string) {
    return this.carsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a draft car listing' })
  @ApiOkResponse({ description: 'Draft car listing updated.' })
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: UpdateCarListingDto,
  ) {
    return this.carsService.update(user.id, id, dto);
  }

  @Post(':id/submit')
  @ApiOperation({ summary: 'Submit a draft car listing for admin review' })
  @ApiCreatedResponse({ description: 'Car listing submitted.' })
  submit(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.carsService.submit(user.id, id);
  }
}
