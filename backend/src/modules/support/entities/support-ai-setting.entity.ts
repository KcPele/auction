import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

/**
 * Singleton row (id='default') holding the AI configuration admins set on the
 * Settings page. We use a row rather than env vars so admins can change the
 * model without redeploying.
 */
@Entity('support_ai_settings')
export class SupportAiSetting {
  @PrimaryColumn({ type: 'varchar', length: 32, default: 'default' })
  id!: string;

  /** OpenRouter model slug, e.g. "openai/gpt-4o-mini". */
  @Column({ type: 'varchar', length: 200 })
  model!: string;

  /** 0..2; OpenAI-style temperature. */
  @Column({ type: 'numeric', precision: 3, scale: 2, default: 0.2 })
  temperature!: string;

  /** Hard cap on tokens per AI reply. */
  @Column({ type: 'integer', default: 800 })
  maxOutputTokens!: number;

  /** Optional override of the system prompt; null falls back to default. */
  @Column({ type: 'text', nullable: true })
  systemPromptOverride!: string | null;

  /** Toggle support assistant off entirely (admin-only conversations). */
  @Column({ type: 'boolean', default: true })
  enabled!: boolean;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
