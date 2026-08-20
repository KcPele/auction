import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { SupportConversationState } from '../../../common/enums/support-conversation-state.enum';

export class ListSupportConversationsQueryDto {
  @ApiPropertyOptional({ enum: SupportConversationState })
  @IsOptional()
  @IsEnum(SupportConversationState)
  state?: SupportConversationState;

  @ApiPropertyOptional({ default: 25, minimum: 1, maximum: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit = 25;

  @ApiPropertyOptional({ default: 0, minimum: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset = 0;
}
