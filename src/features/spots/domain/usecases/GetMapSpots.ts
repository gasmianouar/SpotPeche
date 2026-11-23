import type { MapSpot } from '../entities/Spot';
import type { SpotRepository } from '../repositories/SpotRepository';

/** Quels spots afficher : tous, ou seulement ceux de l'utilisateur. */
export type SpotFilter = 'all' | 'mine';

/**
 * CAS D'USAGE : « récupérer les spots à afficher sur la carte ».
 *
 * La règle métier « vert = mes spots, rouge = ceux des autres » vit ICI,
 * pas dans l'écran : on peut la tester sans téléphone ni carte.
 */
export class GetMapSpots {
  constructor(private readonly spotRepository: SpotRepository) {}

  async execute(currentUserId: string, filter: SpotFilter = 'all'): Promise<MapSpot[]> {
    if (filter === 'mine') {
      if (!currentUserId) return [];
      const mine = await this.spotRepository.getByOwner(currentUserId);
      return mine.map((spot) => ({ spot, isMine: true }));
    }
    const spots = await this.spotRepository.getAll();
    return spots.map((spot) => ({ spot, isMine: spot.ownerId === currentUserId }));
  }
}
