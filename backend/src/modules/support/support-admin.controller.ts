import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { SupportConversationState } from '../../common/enums/support-conversation-state.enum';
import { UserRole } from '../../common/enums/user-role.enum';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { PostSupportMessageDto } from './dto/post-support-message.dto';
import { UpdateSupportSettingsDto } from './dto/update-support-settings.dto';
import { SupportService } from './support.service';

@ApiTags('admin-support')
@ApiCookieAuth('better-auth.session_token')
@Roles(UserRole.Admin)
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('admin/support')
export class SupportAdminController {
  constructor(private readonly service: SupportService) {}

  @Get('conversations')
  @ApiOperation({ summary: 'List every support conversation' })
  @ApiOkResponse({ description: 'Conversations returned.' })
  list(@Query('state') state?: SupportConversationState) {
    return this.service.listAllConversations({ state });
  }

  @Get('conversations/:id')
  getOne(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getConversation(admin, id);
  }

  @Get('conversations/:id/messages')
  messages(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.service.listMessages(admin, id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send an admin message; auto-assigns and pauses the AI',
  })
  post(
    @CurrentUser() admin: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PostSupportMessageDto,
  ) {
    return this.service.postAdminMessage(admin, id, dto.content);
  }

  @Post('conversations/:id/assign')
  @ApiOperation({ summary: 'Take over a conversation' })
  assign(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.service.assignToAdmin(admin, id);
  }

  @Post('conversations/:id/release')
  @ApiOperation({ summary: 'Hand the conversation back to the AI' })
  release(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.service.releaseToAi(admin, id);
  }

  @Post('conversations/:id/resolve')
  @ApiOperation({ summary: 'Mark a conversation resolved' })
  resolve(@CurrentUser() admin: AuthenticatedUser, @Param('id') id: string) {
    return this.service.resolve(admin, id);
  }

  @Get('settings')
  getSettings() {
    return this.service.getSettings();
  }

  @Patch('settings')
  updateSettings(@Body() dto: UpdateSupportSettingsDto) {
    return this.service.updateSettings(dto);
  }
}
