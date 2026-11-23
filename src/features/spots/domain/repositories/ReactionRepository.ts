import type { Reaction, ReactionEmoji } from '../entities/SpotMessage';

/** Contrat d'accès aux réactions emoji sous les messages. */
export interface ReactionRepository {
  listForMessages(messageIds: readonly string[]): Promise<Reaction[]>;
  /** Pose (ou remplace) la réaction d'une personne ; `null` la retire. */
  set(messageId: string, userId: string, emoji: ReactionEmoji | null): Promise<void>;
}
