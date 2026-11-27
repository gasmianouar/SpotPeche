import type { BlockedUser } from '../entities/Report';

/** Contrat d'accès aux blocages entre utilisateurs. */
export interface BlockRepository {
  block(entry: BlockedUser): Promise<void>;
  unblock(blockerId: string, blockedId: string): Promise<void>;
  /** Les personnes bloquées par `blockerId`, la plus récente d'abord. */
  listBlocked(blockerId: string): Promise<BlockedUser[]>;
  /** Raccourci : seulement leurs identifiants (utilisé pour filtrer la carte et les messages). */
  listBlockedIds(blockerId: string): Promise<string[]>;
}
