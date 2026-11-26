import type { RgbImage } from '../../../domain/recognition/RgbImage';
import type { EmbedderOutput, SpeciesEmbedder } from '../../../domain/recognition/SpeciesEmbedder';
import { EMBEDDER_SIZE, embedderInput } from './preprocess';
import type { PteRunner } from './PteRunner';

export const EMBEDDING_DIM = 256;
/** Le modèle Fishial donne aussi 639 probabilités (ses propres classes) : l'app ne s'en sert pas, mais il faut leur place. */
export const FISHIAL_CLASSES = 639;

/** Classifieur Fishial (species-embedder.pte) : image recadrée → empreinte de 256 nombres. */
export class ExecutorchSpeciesEmbedder implements SpeciesEmbedder {
  constructor(private readonly runner: PteRunner) {}

  async embed(image: RgbImage): Promise<EmbedderOutput> {
    const [embedding] = await this.runner.run(
      embedderInput(image),
      [1, 3, EMBEDDER_SIZE, EMBEDDER_SIZE],
      [
        [1, EMBEDDING_DIM],
        [1, FISHIAL_CLASSES],
      ],
    );
    return { embedding: Array.from(embedding) };
  }
}
