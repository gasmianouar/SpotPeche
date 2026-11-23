import type { SpotMessage } from '../entities/SpotMessage';

/** Contrat d'accès aux messages des spots. */
export interface MessageRepository {
  /** Les messages d'un spot, du plus ancien au plus récent. */
  listBySpot(spotId: string): Promise<SpotMessage[]>;
  add(message: SpotMessage): Promise<void>;
}
