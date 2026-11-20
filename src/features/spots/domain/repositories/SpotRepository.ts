import type { Spot } from '../entities/Spot';

/** Contrat d'accès aux spots (base de données, API, mémoire…). */
export interface SpotRepository {
  getAll(): Promise<Spot[]>;
}
