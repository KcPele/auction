import { PartialType } from '@nestjs/swagger';
import { CreateGadgetListingDto } from './create-gadget-listing.dto';

export class UpdateGadgetListingDto extends PartialType(
  CreateGadgetListingDto,
) {}

