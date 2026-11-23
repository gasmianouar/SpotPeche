import type { ImageSourcePropType } from 'react-native';

import type { CatalogKind } from '../../domain/entities/Catalog';

/**
 * Illustrations du catalogue (fichiers PNG en 1x, 2x et 3x dans assets/catalog).
 * C'est la PRÉSENTATION qui associe une image à un identifiant : le domaine n'en sait rien.
 * React Native exige des require() écrits en toutes lettres, d'où cette liste.
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

export function catalogImage(kind: CatalogKind, id: string): ImageSourcePropType | undefined {
  return (kind === 'species' ? SPECIES_IMAGES : BAIT_IMAGES)[id];
}
