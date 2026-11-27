import type { NearbyPlaceSearch } from '../ports/NearbyPlaceSearch';

/** Ce qu'on cherche : les magasins qui vendent des appâts et du matériel de pêche. */
export const BAIT_SHOP_QUERY = 'magasin articles de pêche';

/**
 * CAS D'USAGE : « trouver les boutiques d'appâts les plus proches ».
 * Google Maps fait la recherche autour de la position du téléphone et classe les résultats
 * du plus proche au plus loin, avec les horaires et l'itinéraire.
 */
export class FindNearbyBaitShops {
  constructor(private readonly search: NearbyPlaceSearch) {}

  execute(): Promise<void> {
    return this.search.searchNearby(BAIT_SHOP_QUERY);
  }
}
