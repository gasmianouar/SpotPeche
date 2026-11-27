import type { BlockRepository } from '@/features/moderation/domain/repositories/BlockRepository';

import { isVisibleTo, type MapSpot } from '../entities/Spot';
import type { SpotRepository } from '../repositories/SpotRepository';

/** Quels spots afficher : tous, ou seulement ceux de l'utilisateur. */
export type SpotFilter = 'all' | 'mine';

/**
 * CAS D'USAGE : « récupérer les spots à afficher sur la carte ».
 *
 * Les règles métier vivent ICI, pas dans l'écran (testables sans téléphone ni carte) :
 * - vert = mes spots, rouge = ceux des autres ;
 * - les spots privés des autres ne sont jamais montrés ;
 * - les spots des personnes que j'ai bloquées sont masqués.
 */
export class GetMapSpots {
  constructor(
    private readonly spotRepository: SpotRepository,
    private readonly blockRepository?: Pick<BlockRepository, 'listBlockedIds'>,
  ) {}

  async execute(currentUserId: string, filter: SpotFilter = 'all'): Promise<MapSpot[]> {
    if (filter === 'mine') {
      if (!currentUserId) return [];
      const mine = await this.spotRepository.getByOwner(currentUserId);
      return mine.map((spot) => ({ spot, isMine: true }));
    }
    const [spots, blocked] = await Promise.all([
      this.spotRepository.getAll(),
      currentUserId && this.blockRepository ? this.blockRepository.listBlockedIds(currentUserId) : Promise.resolve([]),
    ]);
    const blockedIds = new Set(blocked);
    return spots
      .filter((spot) => isVisibleTo(spot, currentUserId) && !blockedIds.has(spot.ownerId))
      .map((spot) => ({ spot, isMine: currentUserId !== '' && spot.ownerId === currentUserId }));
  }
}
