import type { Spot } from '../domain/entities/Spot';
import type { SpotRepository } from '../domain/repositories/SpotRepository';

/**
 * Spots d'exemple autour du lac de Créteil (Val-de-Marne), le temps d'avoir
 * un vrai backend. Les spots dont ownerId vaut 'me' sont ceux de
 * l'utilisateur de démo (FakeAuthRepository) : ils apparaîtront en vert.
 */
export const SAMPLE_SPOTS: Spot[] = [
  { id: 's1', name: 'Ponton nord', ownerId: 'u42', coordinates: { latitude: 48.7812, longitude: 2.4455 } },
  { id: 's2', name: 'Rive est', ownerId: 'u17', coordinates: { latitude: 48.7786, longitude: 2.4521 } },
  { id: 's3', name: 'Pont de pierre', ownerId: 'u42', coordinates: { latitude: 48.7745, longitude: 2.4402 } },
  { id: 's4', name: 'Étang sud', ownerId: 'u08', coordinates: { latitude: 48.7718, longitude: 2.4489 } },
  { id: 's5', name: 'Méandre', ownerId: 'u23', coordinates: { latitude: 48.7841, longitude: 2.4378 } },
  { id: 's6', name: 'Ponton des Saules', ownerId: 'me', coordinates: { latitude: 48.7770, longitude: 2.4466 } },
  { id: 's7', name: 'Bras mort', ownerId: 'me', coordinates: { latitude: 48.7731, longitude: 2.4540 } },
  { id: 's8', name: 'Plage aux carpes', ownerId: 'me', coordinates: { latitude: 48.7803, longitude: 2.4352 } },
];

/** Implémentation en mémoire de SpotRepository (sprint 1). */
export class InMemorySpotRepository implements SpotRepository {
  constructor(private readonly spots: Spot[] = SAMPLE_SPOTS) {}

  async getAll(): Promise<Spot[]> {
    return [...this.spots];
  }
}
