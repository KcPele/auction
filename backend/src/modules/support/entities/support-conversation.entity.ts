import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { SupportConversationState } from '../../../common/enums/support-conversation-state.enum';

@Entity('support_conversations')
@Index('IDX_support_conversations_user', ['userId'])
@Index('IDX_support_conversations_state', ['state'])
export class SupportConversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({
    type: 'enum',
    enum: SupportConversationState,
    enumName: 'support_conversation_state_enum',
    default: SupportConversationState.AiActive,
  })
  state!: SupportConversationState;

  /** Subject the user wrote when they opened the ticket (optional). */
  @Column({ type: 'varchar', length: 200, nullable: true })
  subject!: string | null;

  /** Admin who took over the conversation (null while AI is handling). */
  @Column({ type: 'uuid', nullable: true })
  assignedAdminId!: string | null;

  /** Reason supplied when the user requested a handoff. */
  @Column({ type: 'text', nullable: true })
  handoffReason!: string | null;

  /** Last time anyone (user/AI/admin) wrote in the thread. */
  @Column({ type: 'timestamptz', nullable: true })
  lastMessageAt!: Date | null;

  /** Last time the user opened the chat — used for unread badges. */
  @Column({ type: 'timestamptz', nullable: true })
  userLastReadAt!: Date | null;

  /** Last time an admin opened the chat. */
  @Column({ type: 'timestamptz', nullable: true })
  adminLastReadAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
