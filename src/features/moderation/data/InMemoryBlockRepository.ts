import type { BlockedUser } from '../domain/entities/Report';
import type { BlockRepository } from '../domain/repositories/BlockRepository';

/** Blocages en mémoire (tests). */
export class InMemoryBlockRepository implements BlockRepository {
  constructor(private entries: BlockedUser[] = []) {}

  async block(entry: BlockedUser): Promise<void> {
    this.entries = [entry, ...this.entries.filter((e) => !(e.blockerId === entry.blockerId && e.blockedId === entry.blockedId))];
  }

  async unblock(blockerId: string, blockedId: string): Promise<void> {
    this.entries = this.entries.filter((e) => !(e.blockerId === blockerId && e.blockedId === blockedId));
  }

  async listBlocked(blockerId: string): Promise<BlockedUser[]> {
    return this.entries.filter((e) => e.blockerId === blockerId).sort((a, b) => b.createdAt - a.createdAt);
  }

  async listBlockedIds(blockerId: string): Promise<string[]> {
    return (await this.listBlocked(blockerId)).map((e) => e.blockedId);
  }
}
