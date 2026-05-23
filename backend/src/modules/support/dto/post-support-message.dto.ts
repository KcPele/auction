import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength, MinLength } from 'class-validator';

export class PostSupportMessageDto {
  @ApiProperty({ example: 'Hi, my last bid is not showing.' })
  @IsString()
  @MinLength(1)
  @MaxLength(4000)
  content!: string;
}
