import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateSupportConversationDto } from './dto/create-support-conversation.dto';
import { PostSupportMessageDto } from './dto/post-support-message.dto';
import { RequestHandoffDto } from './dto/request-handoff.dto';
import { SupportService } from './support.service';

@ApiTags('support')
@ApiCookieAuth('better-auth.session_token')
@UseGuards(JwtAuthGuard)
@Controller('support')
export class SupportController {
  constructor(private readonly service: SupportService) {}

  @Post('conversations')
  @ApiOperation({ summary: 'Open a new support conversation (AI replies first)' })
  @ApiCreatedResponse({ description: 'Conversation created.' })
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateSupportConversationDto,
  ) {
    return this.service.createConversation(user.id, dto.subject);
  }

  @Get('conversations')
  @ApiOperation({ summary: "List the signed-in user's support conversations" })
  @ApiOkResponse({ description: 'Conversations returned.' })
  listMine(@CurrentUser() user: AuthenticatedUser) {
    return this.service.listMyConversations(user.id);
  }

  @Get('conversations/:id')
  @ApiOperation({ summary: 'Get a single conversation header' })
  getOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.getConversation(user, id);
  }

  @Get('conversations/:id/messages')
  @ApiOperation({ summary: 'List messages in a conversation (marks read)' })
  list(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.listMessages(user, id);
  }

  @Post('conversations/:id/messages')
  @ApiOperation({
    summary: 'Send a user message; AI replies in the same response when active',
  })
  @ApiCreatedResponse({ description: 'User message accepted.' })
  post(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: PostSupportMessageDto,
  ) {
    return this.service.postUserMessage(user, id, dto.content);
  }

  @Post('conversations/:id/handoff')
  @ApiOperation({
    summary: 'Request a human admin take over this conversation',
  })
  handoff(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: RequestHandoffDto,
  ) {
    return this.service.requestHandoff(user, id, dto.reason);
  }

  @Post('conversations/:id/read')
  @ApiOperation({ summary: 'Mark conversation as read up to now' })
  read(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.service.markRead(user, id);
  }
}
