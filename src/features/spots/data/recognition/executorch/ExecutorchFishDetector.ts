import type { FishDetector } from '../../../domain/recognition/FishDetector';
import type { BoundingBox, RgbImage } from '../../../domain/recognition/RgbImage';
import { DETECTOR_SIZE, decodeBestBox, detectorInput } from './preprocess';
import type { PteRunner } from './PteRunner';

/** Nombre de requêtes (boîtes candidates) de RF-DETR Nano. */
export const DETECTOR_QUERIES = 300;

/**
 * Détecteur de poissons RF-DETR Nano du Community Fish Detector (fish-detector.pte, Apache 2.0).
 * L'app n'a besoin que de la boîte la plus sûre : pas de NMS, on renvoie la requête de score maximal
 * (le seuil est appliqué par bestBox).
 */
export class ExecutorchFishDetector implements FishDetector {
  constructor(private readonly runner: PteRunner) {}

  async detect(image: RgbImage): Promise<BoundingBox[]> {
    const input = detectorInput(image, DETECTOR_SIZE);
    const [raw] = await this.runner.run(input, [1, 3, DETECTOR_SIZE, DETECTOR_SIZE], [[1, DETECTOR_QUERIES, 5]]);
    const box = decodeBestBox(raw, image.width, image.height);
    return box ? [box] : [];
  }
}
