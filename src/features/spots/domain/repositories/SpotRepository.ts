import type { Spot } from '../entities/Spot';

/** Contrat d'accès aux spots (base locale, API, mémoire…). */
export interface SpotRepository {
  getAll(): Promise<Spot[]>;
  /** Les spots créés par un utilisateur donné. */
  getByOwner(ownerId: string): Promise<Spot[]>;
}
