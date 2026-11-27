import type { Reaction, ReactionEmoji, SpotMessage } from '../domain/entities/SpotMessage';
import type { MessageRepository } from '../domain/repositories/MessageRepository';
import type { ReactionRepository } from '../domain/repositories/ReactionRepository';

/** Messages en mémoire (tests). */
export class InMemoryMessageRepository implements MessageRepository {
  constructor(private messages: SpotMessage[] = []) {}

  async listBySpot(spotId: string): Promise<SpotMessage[]> {
    return this.messages.filter((m) => m.spotId === spotId).sort((a, b) => a.createdAt - b.createdAt);
  }

  async listByAuthor(authorId: string): Promise<SpotMessage[]> {
    return this.messages.filter((m) => m.author.id === authorId);
  }

  async add(message: SpotMessage): Promise<void> {
    this.messages = [...this.messages.filter((m) => m.id !== message.id), message];
  }
}

/** Réactions en mémoire (tests). */
export class InMemoryReactionRepository implements ReactionRepository {
  constructor(private reactions: Reaction[] = []) {}

  async listForMessages(messageIds: readonly string[]): Promise<Reaction[]> {
    return this.reactions.filter((r) => messageIds.includes(r.messageId));
  }

  async set(messageId: string, userId: string, emoji: ReactionEmoji | null): Promise<void> {
    const others = this.reactions.filter((r) => !(r.messageId === messageId && r.userId === userId));
    this.reactions = emoji ? [...others, { messageId, userId, emoji }] : others;
  }
}
