import type { BlockedUser } from '../entities/Report';
import type { BlockRepository } from '../repositories/BlockRepository';

/** Erreur métier : on ne peut pas se bloquer soi-même (ni bloquer sans être connecté). */
export class BlockNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BlockNotAllowedError';
  }
}

/**
 * CAS D'USAGE : « bloquer un pêcheur ».
 * Ses spots et ses messages disparaissent pour moi. Il n'est pas prévenu.
 */
export class BlockUser {
  constructor(
    private readonly blockRepository: BlockRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(blockerId: string, blocked: { id: string; name: string }): Promise<BlockedUser> {
    if (!blockerId) throw new BlockNotAllowedError('Connectez-vous pour bloquer quelqu’un.');
    if (!blocked.id || blocked.id === blockerId) throw new BlockNotAllowedError('Vous ne pouvez pas vous bloquer vous-même.');
    const entry: BlockedUser = {
      blockerId,
      blockedId: blocked.id,
      blockedName: blocked.name,
      createdAt: this.now().getTime(),
    };
    await this.blockRepository.block(entry);
    return entry;
  }
}

/** CAS D'USAGE : « débloquer un pêcheur ». */
export class UnblockUser {
  constructor(private readonly blockRepository: BlockRepository) {}

  execute(blockerId: string, blockedId: string): Promise<void> {
    return this.blockRepository.unblock(blockerId, blockedId);
  }
}

/** CAS D'USAGE : « la liste des personnes que j'ai bloquées » (réglages du compte). */
export class GetBlockedUsers {
  constructor(private readonly blockRepository: BlockRepository) {}

  async execute(blockerId: string): Promise<BlockedUser[]> {
    return blockerId ? this.blockRepository.listBlocked(blockerId) : [];
  }
}
