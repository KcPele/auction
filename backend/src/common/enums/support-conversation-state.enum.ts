export enum SupportConversationState {
  /** AI is the active responder. */
  AiActive = 'AI_ACTIVE',
  /** Handoff requested — awaiting an admin to take over. */
  WaitingAdmin = 'WAITING_ADMIN',
  /** An admin has taken over; AI is paused. */
  AdminActive = 'ADMIN_ACTIVE',
  /** Marked resolved/closed by admin. */
  Resolved = 'RESOLVED',
}

export enum SupportMessageRole {
  User = 'USER',
  Ai = 'AI',
  Admin = 'ADMIN',
  System = 'SYSTEM',
  Tool = 'TOOL',
}
