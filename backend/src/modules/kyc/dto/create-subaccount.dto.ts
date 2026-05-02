import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateSubaccountDto {
  @ApiProperty({ example: '12345678901' })
  @IsString()
  @Matches(/^[0-9]{11}$/)
  bvn!: string;

  @ApiProperty({ example: 'Lagos' })
  @IsString()
  @MaxLength(80)
  state!: string;

  @ApiProperty({ example: '1234' })
  @IsString()
  @Matches(/^[0-9]{4,6}$/)
  pin!: string;

  @ApiProperty({ example: '12 Marina Road, Lagos' })
  @IsString()
  @MaxLength(180)
  address!: string;

  @ApiProperty({ example: 'NG' })
  @IsString()
  @MaxLength(80)
  country!: string;

  @ApiPropertyOptional({ example: 'KC Pele Auctions' })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  business?: string;

  @ApiPropertyOptional({ example: 'RC' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  companyType?: string;

  @ApiPropertyOptional({ example: '1234567' })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  cac?: string;
}
