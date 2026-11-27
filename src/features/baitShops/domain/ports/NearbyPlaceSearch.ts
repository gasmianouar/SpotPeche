/**
 * CONTRAT : chercher des lieux autour de l'utilisateur dans une app de cartes.
 * Le domaine dit QUOI chercher ; l'adaptateur sait COMMENT ouvrir l'app (Google Maps ici).
 */
export interface NearbyPlaceSearch {
  searchNearby(query: string): Promise<void>;
}
