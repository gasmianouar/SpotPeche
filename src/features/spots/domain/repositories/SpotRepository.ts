import type { Spot } from '../entities/Spot';

/** Contrat d'accès aux spots (base locale, API, mémoire…). */
export interface SpotRepository {
  getAll(): Promise<Spot[]>;
  /** Un spot précis, ou null s'il n'existe pas. */
  getById(id: string): Promise<Spot | null>;
  /** Les spots créés par un utilisateur donné. */
  getByOwner(ownerId: string): Promise<Spot[]>;
  /** Enregistre un spot (création ou mise à jour). */
  save(spot: Spot): Promise<void>;
}
