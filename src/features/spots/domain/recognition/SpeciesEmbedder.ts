import type { RgbImage } from './RgbImage';

/** Ce que le classifieur donne pour une image recadrée. */
export interface EmbedderOutput {
  /** Empreinte de 256 nombres, normée (longueur 1). */
  readonly embedding: number[];
}

/**
 * CONTRAT du classifieur d'espèces : l'empreinte d'une image de poisson.
 * Implémenté sur le téléphone avec ExecuTorch (ConvNeXt de Fishial) ; simulé dans les tests.
 */
export interface SpeciesEmbedder {
  embed(image: RgbImage): Promise<EmbedderOutput>;
}
