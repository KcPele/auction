import { PartialType } from '@nestjs/swagger';
import { CreateCarListingDto } from './create-car-listing.dto';

export class UpdateCarListingDto extends PartialType(CreateCarListingDto) {}

