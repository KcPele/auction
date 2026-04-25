import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { ListingCategory } from '../../../common/enums/listing-category.enum';

export class InitiateTopupDto {
  @ApiProperty({ example: 500000, description: 'Amount in kobo' })
  @IsInt()
  @Min(10000)
  amountKobo!: number;

  @ApiProperty({ enum: ['monnify', 'bank_transfer'], example: 'monnify' })
  @IsString()
  method!: string;

  @ApiPropertyOptional({ enum: ListingCategory })
  @IsOptional()
  @IsEnum(ListingCategory)
  category?: ListingCategory;
}
