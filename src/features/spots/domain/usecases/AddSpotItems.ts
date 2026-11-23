import { findCatalogItems, type CatalogKind } from '../entities/Catalog';
import type { Spot } from '../entities/Spot';
import type { SpotRepository } from '../repositories/SpotRepository';
import { SpotNotFoundError } from './GetSpotDetail';

/**
 * CAS D'USAGE : « ajouter des espèces ou des appâts à un spot ».
 *
 * N'importe quel pêcheur peut compléter un spot, mais on n'efface jamais
 * ce qui existe : la nouvelle liste = l'ancienne + les nouveautés
 * (sans doublon, et seulement des éléments connus du catalogue).
 */
export class AddSpotItems {
  constructor(private readonly spotRepository: SpotRepository) {}

  async execute(spotId: string, kind: CatalogKind, ids: readonly string[]): Promise<Spot> {
    const spot = await this.spotRepository.getById(spotId);
    if (!spot) throw new SpotNotFoundError(spotId);

    const current = kind === 'species' ? spot.speciesIds : spot.baitIds;
    const known = findCatalogItems(kind, ids).map((item) => item.id);
    const additions = [...new Set(known)].filter((id) => !current.includes(id));
    if (additions.length === 0) return spot;

    const merged = [...current, ...additions];
    const updated: Spot = kind === 'species' ? { ...spot, speciesIds: merged } : { ...spot, baitIds: merged };
    await this.spotRepository.save(updated);
    return updated;
  }
}
