import { InMemoryUsageRepository } from '@/features/freeQuota/data/InMemoryUsageRepository';
import { FreeLimitReachedError, FreeQuota } from '@/features/freeQuota/domain/FreeQuota';

import type { ImageRecognizer } from '../../domain/recognition/ImageRecognizer';
import { QuotaLimitedImageRecognizer } from '../recognition/QuotaLimitedImageRecognizer';

describe('QuotaLimitedImageRecognizer', () => {
  it('refuse au-delà de la limite, sans envoyer la photo', async () => {
    const inner: ImageRecognizer = { isDemo: false, recognize: jest.fn().mockResolvedValue({ candidates: [] }) };
    const quota = new FreeQuota(new InMemoryUsageRepository(), () => new Date(2026, 10, 23), { 'fish-activity': 1, 'species-recognition': 1 });
    const recognizer = new QuotaLimitedImageRecognizer(inner, quota);

    await recognizer.recognize('file:///1.jpg');
    await expect(recognizer.recognize('file:///2.jpg')).rejects.toBeInstanceOf(FreeLimitReachedError);
    expect(inner.recognize).toHaveBeenCalledTimes(1);
    expect(recognizer.isDemo).toBe(false);
  });

  it('ne décompte pas une reconnaissance qui a échoué', async () => {
    const inner: ImageRecognizer = { isDemo: false, recognize: jest.fn().mockRejectedValue(new Error('panne')) };
    const quota = new FreeQuota(new InMemoryUsageRepository(), () => new Date(2026, 10, 23));
    await expect(new QuotaLimitedImageRecognizer(inner, quota).recognize('f')).rejects.toThrow('panne');
    expect(await quota.remaining('species-recognition')).toBe(quota.limit('species-recognition'));
  });
});
