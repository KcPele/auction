import { IsString, MinLength } from 'class-validator';

export class RedeemAccessCodeDto {
  @IsString()
  @MinLength(6)
  code!: string;
}

