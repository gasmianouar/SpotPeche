import type { Spot } from '@/features/spots/domain/entities/Spot';
import { creatorPostId } from '@/features/spots/domain/entities/SpotMessage';
import type { MessageRepository } from '@/features/spots/domain/repositories/MessageRepository';
import type { SpotRepository } from '@/features/spots/domain/repositories/SpotRepository';

import type { Catch } from '../entities/Catch';

/**
 * CAS D'USAGE : « mes prises », c'est-à-dire toutes les photos que j'ai publiées :
 * - celles de la création de mes spots ;
 * - celles de mes messages, sur n'importe quel spot.
 * Chaque photo garde son lieu (le spot) et sa date. Les plus récentes d'abord.
 */
export class GetMyCatches {
  constructor(
    private readonly spotRepository: SpotRepository,
    private readonly messageRepository: MessageRepository,
  ) {}

  async execute(userId: string): Promise<Catch[]> {
    const [spots, myMessages] = await Promise.all([
      this.spotRepository.getAll(),
      this.messageRepository.listByAuthor(userId),
    ]);
    const spotsById = new Map(spots.map((spot) => [spot.id, spot]));

    const fromMySpots = spots
      .filter((spot) => spot.ownerId === userId)
      .flatMap((spot) => toCatches(creatorPostId(spot.id), spot, spot.photoUris, spot.createdAt));

    const fromMyMessages = myMessages.flatMap((message) => {
      const spot = spotsById.get(message.spotId);
      // Un message dont le spot n'existe plus n'a pas de lieu : on l'ignore.
      return spot ? toCatches(message.id, spot, message.photoUris, message.createdAt) : [];
    });

    return [...fromMySpots, ...fromMyMessages].sort((a, b) => b.takenAt - a.takenAt);
  }
}

function toCatches(sourceId: string, spot: Spot, photoUris: readonly string[], takenAt: number): Catch[] {
  return photoUris.map((photoUri, index) => ({
    id: `${sourceId}:${index}`,
    photoUri,
    spotId: spot.id,
    placeName: spot.name,
    coordinates: spot.coordinates,
    takenAt,
  }));
}
