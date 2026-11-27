import type { IdGenerator } from '@/core/ids/IdGenerator';
import type { Coordinates } from '@/shared/domain/Coordinates';

import { findCatalogItems } from '../entities/Catalog';
import { isSpotVisibility, type FishActivity, type Spot, type SpotVisibility } from '../entities/Spot';
import type { SpotAuthor } from '../entities/SpotMessage';
import type { ActivityVoteRepository } from '../repositories/ActivityVoteRepository';
import type { SpotRepository } from '../repositories/SpotRepository';

/** Ce que l'utilisateur a saisi dans l'écran « Nouveau spot ». */
export interface SpotDraft {
  coordinates: Coordinates | null;
  speciesIds: readonly string[];
  baitIds: readonly string[];
  activity: FishActivity | null;
  /** Qui pourra voir le spot (privé par défaut dans le formulaire). */
  visibility: SpotVisibility;
  description: string;
  photoUris: readonly string[];
}

export const DESCRIPTION_MAX_LENGTH = 500;

/** Erreur métier : la saisie est incomplète ou invalide. `field` dit quoi corriger. */
export class SpotValidationError extends Error {
  constructor(
    readonly field: 'coordinates' | 'description',
    message: string,
  ) {
    super(message);
    this.name = 'SpotValidationError';
  }
}

/**
 * CAS D'USAGE : « créer un spot ».
 *
 * 1. valide la saisie (règles métier, testées sans téléphone) ;
 * 2. fabrique l'entité Spot complète (id, créateur et son profil, nom, date) ;
 * 3. l'enregistre via le repository, sans savoir que c'est du SQLite ;
 * 4. l'activité choisie devient l'avis du créateur.
 */
export class CreateSpot {
  constructor(
    private readonly spotRepository: SpotRepository,
    private readonly voteRepository: ActivityVoteRepository,
    private readonly idGenerator: IdGenerator,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(draft: SpotDraft, owner: SpotAuthor): Promise<Spot> {
    const coordinates = this.validateCoordinates(draft.coordinates);
    const description = draft.description.trim();
    if (description.length > DESCRIPTION_MAX_LENGTH) {
      throw new SpotValidationError(
        'description',
        `La description ne doit pas dépasser ${DESCRIPTION_MAX_LENGTH} caractères.`,
      );
    }

    const createdAt = this.now();
    const spot: Spot = {
      id: this.idGenerator.next(),
      name: buildSpotName(draft.speciesIds, createdAt),
      coordinates,
      ownerId: owner.id,
      ownerName: owner.name,
      ownerPhotoUrl: owner.photoUrl,
      // On ne garde que des identifiants connus du catalogue, sans doublon.
      speciesIds: unique(findCatalogItems('species', draft.speciesIds).map((s) => s.id)),
      baitIds: unique(findCatalogItems('bait', draft.baitIds).map((b) => b.id)),
      activity: draft.activity,
      // Par prudence, une valeur inattendue rend le spot privé.
      visibility: isSpotVisibility(draft.visibility) ? draft.visibility : 'private',
      description,
      photoUris: [...draft.photoUris],
      createdAt: createdAt.getTime(),
    };

    await this.spotRepository.save(spot);
    // L'activité choisie à la création compte comme le premier avis « ça mord ? » (celui du créateur).
    if (spot.activity) await this.voteRepository.set(spot.id, owner.id, spot.activity);
    return spot;
  }

  private validateCoordinates(coordinates: Coordinates | null): Coordinates {
    if (!coordinates) {
      throw new SpotValidationError('coordinates', 'Placez le spot sur la carte ou utilisez votre position.');
    }
    const { latitude, longitude } = coordinates;
    const valid =
      Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180;
    if (!valid) throw new SpotValidationError('coordinates', 'Position invalide.');
    return { latitude, longitude };
  }
}

/** Le formulaire n'a plus de champ « nom » : on en fabrique un, lisible, à partir des données. */
export function buildSpotName(speciesIds: readonly string[], date: Date): string {
  const day = `${String(date.getDate()).padStart(2, '0')}/${String(date.getMonth() + 1).padStart(2, '0')}`;
  const [firstSpecies] = findCatalogItems('species', speciesIds);
  return firstSpecies ? `Spot à ${firstSpecies.name.toLowerCase()} du ${day}` : `Spot du ${day}`;
}

function unique(ids: string[]): string[] {
  return [...new Set(ids)];
}
