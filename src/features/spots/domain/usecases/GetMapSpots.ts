import type { MapSpot } from '../entities/Spot';
import type { SpotRepository } from '../repositories/SpotRepository';

/**
 * CAS D'USAGE : « récupérer les spots à afficher sur la carte ».
 *
 * La règle métier « vert = mes spots, rouge = ceux des autres » vit ICI,
 * pas dans l'écran : on peut la tester sans téléphone ni carte.
 */
export class GetMapSpots {
  constructor(private readonly spotRepository: SpotRepository) {}

  async execute(currentUserId: string): Promise<MapSpot[]> {
    const spots = await this.spotRepository.getAll();
    return spots.map((spot) => ({ spot, isMine: spot.ownerId === currentUserId }));
  }
}
