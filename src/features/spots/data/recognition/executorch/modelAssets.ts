/**
 * Les fichiers des modèles embarqués dans l'app (assets/models, produits par scripts/ml).
 * Seul le conteneur importe ce fichier : les tests des adaptateurs n'en ont pas besoin.
 * Metro reconnaît l'extension .pte grâce à metro.config.js.
 */
import head from '../../../../../../assets/models/species-head.json';

import type { SpeciesHeadFile } from './speciesHead';

export const MODEL_ASSETS = {
  detector: require('../../../../../../assets/models/fish-detector.pte') as number,
  embedder: require('../../../../../../assets/models/species-embedder.pte') as number,
};

export const SPECIES_HEAD: SpeciesHeadFile = head;
