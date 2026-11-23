import { FreeLimitReachedError, type FreeQuota } from '@/features/freeQuota/domain/FreeQuota';

import type { ImageRecognizer, RecognitionOutcome } from '../../domain/recognition/ImageRecognizer';

/**
 * DÉCORATEUR « limite gratuite » de la reconnaissance : au-delà de la limite du jour,
 * on refuse AVANT d'envoyer la photo (donc sans rien payer) avec FreeLimitReachedError.
 * Seule une reconnaissance réussie est décomptée.
 */
export class QuotaLimitedImageRecognizer implements ImageRecognizer {
  constructor(
    private readonly inner: ImageRecognizer,
    private readonly quota: FreeQuota,
  ) {}

  get isDemo(): boolean {
    return this.inner.isDemo;
  }

  async recognize(photoUri: string): Promise<RecognitionOutcome> {
    if ((await this.quota.remaining('species-recognition')) === 0) {
      throw new FreeLimitReachedError('species-recognition', this.quota.limit('species-recognition'));
    }
    const outcome = await this.inner.recognize(photoUri);
    await this.quota.record('species-recognition');
    return outcome;
  }
}
