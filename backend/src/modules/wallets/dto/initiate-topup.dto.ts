import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class InitiateTopupDto {
  @ApiProperty({ example: 500000, description: 'Amount in kobo' })
  @IsInt()
  @Min(10000)
  amountKobo!: number;

  @ApiProperty({ enum: ['bank_transfer'], example: 'bank_transfer' })
  @IsIn(['bank_transfer'])
  method!: 'bank_transfer';

  @ApiPropertyOptional({ enum: ListingCategory })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;
}
