import { IsOptional, IsString } from 'class-validator';

export class ReviewListingApplicationDto {
  @IsOptional()
  @IsString()
  reviewNote?: string;
}

