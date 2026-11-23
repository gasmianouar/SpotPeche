/**
 * Données de référence : les espèces de poissons et les appâts que l'on peut
 * associer à un spot. Le domaine ne connaît que des identifiants et des noms ;
 * les illustrations sont choisies par la couche présentation.
 */
export type CatalogKind = 'species' | 'bait';

export interface CatalogItem {
  readonly id: string;
  readonly name: string;
  /** Nom scientifique (espèces seulement). */
  readonly latinName?: string;
}

export const SPECIES_CATALOG: readonly CatalogItem[] = [
  { id: 'brochet', name: 'Brochet', latinName: 'Esox lucius' },
  { id: 'sandre', name: 'Sandre', latinName: 'Sander lucioperca' },
  { id: 'perche', name: 'Perche', latinName: 'Perca fluviatilis' },
  { id: 'carpe', name: 'Carpe', latinName: 'Cyprinus carpio' },
  { id: 'truite', name: 'Truite', latinName: 'Salmo trutta' },
  { id: 'blackbass', name: 'Black-bass', latinName: 'Micropterus salmoides' },
  { id: 'silure', name: 'Silure', latinName: 'Silurus glanis' },
  { id: 'gardon', name: 'Gardon', latinName: 'Rutilus rutilus' },
];

export const BAIT_CATALOG: readonly CatalogItem[] = [
  { id: 'worm', name: 'Ver de terre' },
  { id: 'maggot', name: 'Asticots' },
  { id: 'corn', name: 'Maïs' },
  { id: 'boilie', name: 'Bouillette' },
  { id: 'shad', name: 'Leurre souple' },
  { id: 'spoon', name: 'Cuillère' },
  { id: 'crank', name: 'Poisson nageur' },
  { id: 'fly', name: 'Mouche' },
];

export function catalogFor(kind: CatalogKind): readonly CatalogItem[] {
  return kind === 'species' ? SPECIES_CATALOG : BAIT_CATALOG;
}

/** Retrouve des éléments du catalogue par leurs identifiants, en ignorant les inconnus. */
export function findCatalogItems(kind: CatalogKind, ids: readonly string[]): CatalogItem[] {
  const catalog = catalogFor(kind);
  return ids.map((id) => catalog.find((item) => item.id === id)).filter((item): item is CatalogItem => !!item);
}
