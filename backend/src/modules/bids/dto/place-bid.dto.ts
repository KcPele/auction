import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

export class PlaceBidDto {
  @ApiProperty({
    description: 'Bid amount in kobo.',
    example: 255000000,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  amountKobo!: number;
}
