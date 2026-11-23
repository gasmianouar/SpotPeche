import { SPECIES_CATALOG, type CatalogItem } from '../entities/Catalog';
import type { ImageRecognizer } from '../recognition/ImageRecognizer';

export interface RecognitionResult {
  readonly item: CatalogItem;
  /** Confiance entre 0 et 1. */
  readonly confidence: number;
}

export interface RecognitionReport {
  readonly results: RecognitionResult[];
  /** Explication courte de l'agent (indices vus, ou pourquoi rien n'est reconnu). */
  readonly note: string | null;
  /** true en mode démonstration : la photo n'a pas vraiment été analysée. */
  readonly isDemo: boolean;
}

/** Nombre maximal de propositions montrées à l'utilisateur. */
export const MAX_RESULTS = 3;

/**
 * CAS D'USAGE : « reconnaître l'espèce d'un poisson sur une photo ».
 *
 * Règles métier, indépendantes de l'IA utilisée :
 * - on ignore les réponses qui ne sont pas dans notre catalogue ;
 * - on trie de la plus probable à la moins probable ;
 * - on garde les 3 meilleures.
 */
export class RecognizeFromPhoto {
  constructor(private readonly recognizer: ImageRecognizer) {}

  async execute(photoUri: string): Promise<RecognitionReport> {
    const { candidates, note } = await this.recognizer.recognize(photoUri);
    const catalog = SPECIES_CATALOG;

    const results = candidates
      .map((candidate) => ({
        item: catalog.find((item) => item.id === candidate.id),
        confidence: Math.min(1, Math.max(0, candidate.confidence)),
      }))
      .filter((result): result is RecognitionResult => result.item !== undefined)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_RESULTS);

    return { results, note: note?.trim() || null, isDemo: this.recognizer.isDemo };
  }
}
