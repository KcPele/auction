import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateGadgetListingDto {
  @ApiProperty({ example: 'Phone' })
  @IsString()
  type!: string;

  @ApiProperty({ example: 'Apple' })
  @IsString()
  brand!: string;

  @ApiProperty({ example: 'iPhone 14 Pro' })
  @IsString()
  model!: string;

  @ApiProperty({ example: 'Space Black' })
  @IsString()
  colour!: string;

  @ApiPropertyOptional({ example: 88 })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(100)
  batteryHealthPercent?: number;

  @ApiProperty({ example: { ram: '6GB', storage: '256GB' } })
  @IsObject()
  specs!: Record<string, string>;

  @ApiProperty({ example: 'Used for one year by first owner.' })
  @IsString()
  usageHistory!: string;

  @ApiPropertyOptional({ example: 'Small scratch on the side.' })
  @IsOptional()
  @IsString()
  defects?: string;

  @ApiProperty({ example: 'https://cdn.example.com/receipt.pdf' })
  @IsString()
  proofDocumentUrl!: string;

  @ApiProperty({ type: [String], example: ['https://cdn.example.com/a.jpg'] })
  @IsArray()
  @ArrayMinSize(1)
  @IsString({ each: true })
  photoUrls!: string[];

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  videoUrls?: string[];

  @ApiProperty({ example: 45000000 })
  @IsInt()
  @Min(1)
  basePriceKobo!: number;

  @ApiProperty({ example: 10, minimum: 10, maximum: 20 })
  @IsInt()
  @Min(10)
  @Max(20)
  holdPercent!: number;

  @ApiProperty({ example: 1000000 })
  @IsInt()
  @Min(1)
  minimumBidIncrementKobo!: number;

  @ApiProperty({ example: '2026-05-01T12:00:00.000Z' })
  @IsDateString()
  startTime!: string;

  @ApiProperty({ example: 60 })
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}

