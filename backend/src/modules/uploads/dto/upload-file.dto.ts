import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ListingCategory } from '../../../common/enums/listing-category.enum';
import { UploadPurpose } from '../../../common/enums/upload-purpose.enum';

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary' })
  file!: unknown;

  @ApiProperty({ enum: UploadPurpose })
  purpose!: UploadPurpose;

  @ApiPropertyOptional({ enum: ListingCategory })
  category?: ListingCategory;
}

export class UploadBatchDto {
  @ApiProperty({ type: 'array', items: { type: 'string', format: 'binary' } })
  files!: unknown[];

  @ApiProperty({ enum: UploadPurpose })
  purpose!: UploadPurpose;

  @ApiPropertyOptional({ enum: ListingCategory })
  category?: ListingCategory;
}
