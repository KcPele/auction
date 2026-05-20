import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCarListingDto {
  @ApiProperty({ example: 'Toyota' })
  @IsString()
  @MaxLength(100)
  make!: string;

  @ApiProperty({ example: 'Camry' })
  @IsString()
  @MaxLength(100)
  model!: string;

  @ApiProperty({ example: 2018 })
  @IsInt()
  @Min(1900)
  year!: number;

  @ApiProperty({ example: 'Black' })
  @IsString()
  @MaxLength(50)
  colour!: string;

  @ApiProperty({ example: 'ABC-123-LA' })
  @IsString()
  @MaxLength(50)
  registrationNumber!: string;

  @ApiProperty({ example: 68000 })
  @IsInt()
  @Min(0)
  mileage!: number;

  @ApiProperty({ example: 'Good' })
  @IsString()
  @MaxLength(100)
  condition!: string;

  @ApiPropertyOptional({ example: 'AC needs servicing.' })
  @IsOptional()
  @IsString()
  knownFaults?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  mechanicId?: string;

  @ApiProperty({ type: [String], example: ['https://cdn.example.com/car.jpg'] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @IsString({ each: true })
  photoUrls!: string[];

  @ApiProperty({ example: 250000000 })
  @IsInt()
  @Min(1)
  basePriceKobo!: number;

  @ApiProperty({ example: 10, minimum: 10, maximum: 20 })
  @IsInt()
  @Min(10)
  @Max(20)
  holdPercent!: number;

  @ApiProperty({ example: 5000000 })
  @IsInt()
  @Min(1)
  minimumBidIncrementKobo!: number;

  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: 120 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}
