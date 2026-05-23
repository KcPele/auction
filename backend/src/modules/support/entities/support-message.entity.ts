import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { SupportMessageRole } from '../../../common/enums/support-conversation-state.enum';

@Entity('support_messages')
@Index('IDX_support_messages_conv', ['conversationId', 'createdAt'])
export class SupportMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  conversationId!: string;

  @Column({
    type: 'enum',
    enum: SupportMessageRole,
    enumName: 'support_message_role_enum',
  })
  role!: SupportMessageRole;

  /** Author user id when role=USER or ADMIN; null for AI / SYSTEM / TOOL. */
  @Column({ type: 'uuid', nullable: true })
  authorId!: string | null;

  /** Plain-text or markdown content. Empty when the assistant only ran tools. */
  @Column({ type: 'text' })
  content!: string;

  /**
   * Tool-calling metadata for AI turns. Stores `{ name, args, result }`
   * tuples so admins can audit what the assistant looked up. Never used to
   * surface user data to other users — only the same conversation reads it.
   */
  @Column({ type: 'jsonb', nullable: true })
  toolCalls!: Array<{
    name: string;
    args: Record<string, unknown>;
    result: unknown;
  }> | null;

  /** OpenRouter model identifier when role=AI. */
  @Column({ type: 'varchar', length: 120, nullable: true })
  model!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;
}
