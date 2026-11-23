import { InMemoryUsageRepository } from '../../data/InMemoryUsageRepository';
import { FREE_DAILY_LIMITS, FreeLimitReachedError, FreeQuota, freeLimitMessage } from '../FreeQuota';

describe('FreeQuota', () => {
  it('décompte les utilisations du jour, par fonction', async () => {
    const quota = new FreeQuota(new InMemoryUsageRepository(), () => new Date(2026, 10, 23, 10));
    expect(await quota.remaining('fish-activity')).toBe(FREE_DAILY_LIMITS['fish-activity']);

    await quota.record('fish-activity');
    await quota.record('fish-activity');

    expect(await quota.remaining('fish-activity')).toBe(FREE_DAILY_LIMITS['fish-activity'] - 2);
    expect(await quota.remaining('species-recognition')).toBe(FREE_DAILY_LIMITS['species-recognition']);
  });

  it('ne descend jamais sous zéro, et repart à zéro le lendemain', async () => {
    const usage = new InMemoryUsageRepository();
    let now = new Date(2026, 10, 23, 23, 50);
    const quota = new FreeQuota(usage, () => now, { 'fish-activity': 1, 'species-recognition': 1 });

    await quota.record('species-recognition');
    await quota.record('species-recognition');
    expect(await quota.remaining('species-recognition')).toBe(0);

    now = new Date(2026, 10, 24, 0, 5);
    expect(await quota.remaining('species-recognition')).toBe(1);
  });

  it('le message annonce la version payante', () => {
    expect(freeLimitMessage('fish-activity', 5)).toContain('5 analyses IA par jour');
    expect(freeLimitMessage('species-recognition', 5)).toContain('version payante');
    expect(new FreeLimitReachedError('species-recognition', 5).message).toBe(freeLimitMessage('species-recognition', 5));
  });
});
