export type SupportState =
  | "AI_ACTIVE"
  | "WAITING_ADMIN"
  | "ADMIN_ACTIVE"
  | "RESOLVED";

export type SupportRole = "USER" | "AI" | "ADMIN" | "SYSTEM" | "TOOL";

export interface SupportConversationDto {
  id: string;
  userId: string;
  userName: string | null;
  userEmail: string | null;
  state: SupportState;
  subject: string | null;
  assignedAdminId: string | null;
  handoffReason: string | null;
  lastMessageAt: string | null;
  userLastReadAt: string | null;
  adminLastReadAt: string | null;
  unreadForUser: boolean;
  unreadForAdmin: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportMessageDto {
  id: string;
  conversationId: string;
  role: SupportRole;
  authorId: string | null;
  content: string;
  toolCalls: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }> | null;
  model: string | null;
  createdAt: string;
}

export interface SupportConversation extends Omit<
  SupportConversationDto,
  "lastMessageAt" | "userLastReadAt" | "adminLastReadAt" | "createdAt" | "updatedAt"
> {
  lastMessageAt: Date | null;
  userLastReadAt: Date | null;
  adminLastReadAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface SupportMessage extends Omit<SupportMessageDto, "createdAt"> {
  createdAt: Date;
}

export interface SupportSettings {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  systemPromptOverride: string | null;
  enabled: boolean;
  updatedAt: string;
}

const parseDate = (s: string | null): Date | null => (s ? new Date(s) : null);

export const toSupportConversation = (
  dto: SupportConversationDto,
): SupportConversation => ({
  ...dto,
  lastMessageAt: parseDate(dto.lastMessageAt),
  userLastReadAt: parseDate(dto.userLastReadAt),
  adminLastReadAt: parseDate(dto.adminLastReadAt),
  createdAt: new Date(dto.createdAt),
  updatedAt: new Date(dto.updatedAt),
});

export const toSupportMessage = (dto: SupportMessageDto): SupportMessage => ({
  ...dto,
  createdAt: new Date(dto.createdAt),
});
