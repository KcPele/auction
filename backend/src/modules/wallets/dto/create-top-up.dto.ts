import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTopUpDto {
  @ApiProperty({
    description: 'Top-up amount in kobo.',
    example: 500000,
    minimum: 10000,
  })
  @IsInt()
  @Min(10000)
  @Max(100_000_000_000)
  amountKobo!: number;

  @ApiPropertyOptional({ default: 'NGN' })
  @IsOptional()
  @IsString()
  currency?: string;
}
