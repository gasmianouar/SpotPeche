import { catalogFor, type CatalogItem, type CatalogKind } from '../entities/Catalog';
import type { ImageRecognizer } from '../recognition/ImageRecognizer';

export interface RecognitionResult {
  readonly item: CatalogItem;
  /** Confiance entre 0 et 1. */
  readonly confidence: number;
}

/** Nombre maximal de propositions montrées à l'utilisateur. */
export const MAX_RESULTS = 3;

/**
 * CAS D'USAGE : « reconnaître une espèce (ou un appât) sur une photo ».
 *
 * Règles métier, indépendantes de l'IA utilisée :
 * - on ignore les réponses qui ne sont pas dans notre catalogue ;
 * - on trie de la plus probable à la moins probable ;
 * - on garde les 3 meilleures.
 */
export class RecognizeFromPhoto {
  constructor(private readonly recognizer: ImageRecognizer) {}

  async execute(kind: CatalogKind, photoUri: string): Promise<RecognitionResult[]> {
    const candidates = await this.recognizer.recognize(kind, photoUri);
    const catalog = catalogFor(kind);

    return candidates
      .map((candidate) => ({
        item: catalog.find((item) => item.id === candidate.id),
        confidence: Math.min(1, Math.max(0, candidate.confidence)),
      }))
      .filter((result): result is RecognitionResult => result.item !== undefined)
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, MAX_RESULTS);
  }
}
