import type { BoundingBox, RgbImage } from './RgbImage';

/**
 * CONTRAT du détecteur de poissons : où sont les poissons sur la photo ?
 * Implémenté sur le téléphone avec ExecuTorch (YOLO26 de Fishial) ; simulé dans les tests.
 */
export interface FishDetector {
  /** Boîtes en pixels de l'image reçue (vide si aucun poisson). */
  detect(image: RgbImage): Promise<BoundingBox[]>;
}
