import type { User } from '../users/entities/user.entity';
import type { SupportConversation } from './entities/support-conversation.entity';
import type { SupportMessage } from './entities/support-message.entity';

export function presentSupportConversation(
  conversation: SupportConversation,
  user?: User,
) {
  const unreadForUser =
    conversation.lastMessageAt &&
    (!conversation.userLastReadAt ||
      conversation.lastMessageAt > conversation.userLastReadAt);
  const unreadForAdmin =
    conversation.lastMessageAt &&
    (!conversation.adminLastReadAt ||
      conversation.lastMessageAt > conversation.adminLastReadAt);
  return {
    id: conversation.id,
    userId: conversation.userId,
    userName: user ? `${user.firstName} ${user.lastName}`.trim() : null,
    userEmail: user?.email ?? null,
    state: conversation.state,
    subject: conversation.subject,
    assignedAdminId: conversation.assignedAdminId,
    handoffReason: conversation.handoffReason,
    lastMessageAt: conversation.lastMessageAt,
    userLastReadAt: conversation.userLastReadAt,
    adminLastReadAt: conversation.adminLastReadAt,
    unreadForUser: Boolean(unreadForUser),
    unreadForAdmin: Boolean(unreadForAdmin),
    createdAt: conversation.createdAt,
    updatedAt: conversation.updatedAt,
  };
}

export function presentSupportMessage(message: SupportMessage) {
  return {
    id: message.id,
    conversationId: message.conversationId,
    role: message.role,
    authorId: message.authorId,
    content: message.content,
    toolCalls: message.toolCalls,
    model: message.model,
    createdAt: message.createdAt,
  };
}
