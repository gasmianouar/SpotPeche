import type { PhotoPixelsReader } from '@/core/media/PhotoPixelsReader';

import type { FishDetector } from '../../domain/recognition/FishDetector';
import { RecognitionUnavailableError, type ImageRecognizer, type RecognitionOutcome } from '../../domain/recognition/ImageRecognizer';
import { bestBox, cropToBox } from '../../domain/recognition/RgbImage';
import type { SpeciesEmbedder } from '../../domain/recognition/SpeciesEmbedder';
import { DEFAULT_SCORE_OPTIONS, scoreSpecies, type ScoreOptions, type SpeciesHead } from '../../domain/recognition/scoreSpecies';

export const NO_FISH_NOTE = 'Aucun poisson repéré nettement : toute la photo a été analysée.';

/**
 * Reconnaissance de l'espèce SUR LE TÉLÉPHONE : gratuite, illimitée, sans réseau.
 * photo → pixels → détection du poisson → recadrage → empreinte → couche de décision → score sur le catalogue.
 */
export class OnDeviceImageRecognizer implements ImageRecognizer {
  readonly isDemo = false;

  constructor(
    private readonly photos: PhotoPixelsReader,
    private readonly detector: FishDetector,
    private readonly embedder: SpeciesEmbedder,
    /** La couche de décision, ou une fonction qui la charge au premier usage (une erreur ne fait pas planter l'app). */
    private readonly head: SpeciesHead | (() => SpeciesHead),
    private readonly options: ScoreOptions = DEFAULT_SCORE_OPTIONS,
  ) {}

  private loaded: SpeciesHead | null = null;

  private speciesHead(): SpeciesHead {
    if (!this.loaded) this.loaded = typeof this.head === 'function' ? this.head() : this.head;
    return this.loaded;
  }

  async recognize(photoUri: string): Promise<RecognitionOutcome> {
    let embedding;
    let foundFish;
    let head;
    try {
      head = this.speciesHead();
      const image = await this.photos.read(photoUri);
      const box = bestBox(await this.detector.detect(image));
      foundFish = box !== null;
      embedding = await this.embedder.embed(box ? cropToBox(image, box) : image);
    } catch (error) {
      throw new RecognitionUnavailableError(error instanceof Error ? error.message : String(error));
    }

    const outcome = scoreSpecies({ embedding: embedding.embedding, head }, this.options);
    // « Je ne sais pas » garde sa propre note ; sinon on signale qu'aucun poisson n'a été repéré.
    return !foundFish && outcome.candidates.length > 0 ? { ...outcome, note: NO_FISH_NOTE } : outcome;
  }
}
