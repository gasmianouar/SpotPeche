import type { ImageSourcePropType } from 'react-native';

import { SPECIES_CATALOG, type CatalogKind, type SpeciesFamily } from '../../domain/entities/Catalog';

/**
 * Illustrations du catalogue (fichiers PNG en 1x, 2x et 3x dans assets/catalog).
 * C'est la PRÉSENTATION qui associe une image à un identifiant : le domaine n'en sait rien.
 * React Native exige des require() écrits en toutes lettres, d'où cette liste.
 * Une espèce sans dessin propre (la plupart des espèces marines) affiche la silhouette de sa FAMILLE
 * (scripts/catalog/draw_family_silhouettes.py) : ajouter un dessin plus tard ne demande qu'une ligne ici.
 */
const SPECIES_IMAGES: Record<string, ImageSourcePropType> = {
  brochet: require('../../../../../assets/catalog/species-brochet.png'),
  sandre: require('../../../../../assets/catalog/species-sandre.png'),
  perche: require('../../../../../assets/catalog/species-perche.png'),
  carpe: require('../../../../../assets/catalog/species-carpe.png'),
  truite: require('../../../../../assets/catalog/species-truite.png'),
  blackbass: require('../../../../../assets/catalog/species-blackbass.png'),
  silure: require('../../../../../assets/catalog/species-silure.png'),
  gardon: require('../../../../../assets/catalog/species-gardon.png'),
};

const FAMILY_IMAGES: Partial<Record<SpeciesFamily, ImageSourcePropType>> = {
  bass: require('../../../../../assets/catalog/family-bass.png'),
  sparid: require('../../../../../assets/catalog/family-sparid.png'),
  mullet: require('../../../../../assets/catalog/family-mullet.png'),
  mackerel: require('../../../../../assets/catalog/family-mackerel.png'),
  gadid: require('../../../../../assets/catalog/family-gadid.png'),
  wrasse: require('../../../../../assets/catalog/family-wrasse.png'),
  flatfish: require('../../../../../assets/catalog/family-flatfish.png'),
  eel: require('../../../../../assets/catalog/family-eel.png'),
  scorpionfish: require('../../../../../assets/catalog/family-scorpionfish.png'),
  cephalopod: require('../../../../../assets/catalog/family-cephalopod.png'),
  shark: require('../../../../../assets/catalog/family-shark.png'),
  other: require('../../../../../assets/catalog/family-other.png'),
};

const BAIT_IMAGES: Record<string, ImageSourcePropType> = {
  worm: require('../../../../../assets/catalog/bait-worm.png'),
  maggot: require('../../../../../assets/catalog/bait-maggot.png'),
  corn: require('../../../../../assets/catalog/bait-corn.png'),
  boilie: require('../../../../../assets/catalog/bait-boilie.png'),
  shad: require('../../../../../assets/catalog/bait-shad.png'),
  spoon: require('../../../../../assets/catalog/bait-spoon.png'),
  crank: require('../../../../../assets/catalog/bait-crank.png'),
  fly: require('../../../../../assets/catalog/bait-fly.png'),
};

export function familyImage(family: SpeciesFamily): ImageSourcePropType | undefined {
  return FAMILY_IMAGES[family];
}

export function catalogImage(kind: CatalogKind, id: string): ImageSourcePropType | undefined {
  if (kind === 'bait') return BAIT_IMAGES[id];
  if (SPECIES_IMAGES[id]) return SPECIES_IMAGES[id];
  const family = SPECIES_CATALOG.find((s) => s.id === id)?.family;
  return family ? familyImage(family) : undefined;
}
