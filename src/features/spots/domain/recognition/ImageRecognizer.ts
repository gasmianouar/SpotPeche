import type { CatalogKind } from '../entities/Catalog';

/** Une proposition de l'agent IA : un identifiant du catalogue et une confiance entre 0 et 1. */
export interface RecognitionCandidate {
  readonly id: string;
  readonly confidence: number;
}

/**
 * CONTRAT de la reconnaissance d'image.
 *
 * Le domaine demande « qu'y a-t-il sur cette photo ? » sans savoir qui répond :
 * un agent IA derrière un serveur, un modèle embarqué, ou une version de démo.
 */
export interface ImageRecognizer {
  recognize(kind: CatalogKind, photoUri: string): Promise<RecognitionCandidate[]>;
}
