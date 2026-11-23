import { isReactionEmoji, type ReactionEmoji } from '../entities/SpotMessage';
import type { ReactionRepository } from '../repositories/ReactionRepository';

/**
 * CAS D'USAGE : « réagir à un message avec un emoji ».
 * Comme sur Messenger : une réaction par personne ; choisir un autre emoji la remplace,
 * toucher de nouveau le même la retire. Renvoie ma réaction après l'action.
 */
export class ReactToMessage {
  constructor(private readonly reactionRepository: ReactionRepository) {}

  async execute(messageId: string, userId: string, emoji: string): Promise<ReactionEmoji | null> {
    if (!isReactionEmoji(emoji)) throw new Error(`Réaction inconnue : ${emoji}`);

    const existing = await this.reactionRepository.listForMessages([messageId]);
    const mine = existing.find((r) => r.userId === userId)?.emoji ?? null;
    const next = mine === emoji ? null : emoji;
    await this.reactionRepository.set(messageId, userId, next);
    return next;
  }
}
