import { InMemoryUsageRepository } from '@/features/freeQuota/data/InMemoryUsageRepository';
import { FreeQuota } from '@/features/freeQuota/domain/FreeQuota';

import type { FishActivityAdvisor } from '../../domain/ports/FishActivityAdvisor';
import { aContext } from '../../testing/forecastTestData';
import { LocalFishActivityAdvisor } from '../LocalFishActivityAdvisor';
import { QuotaLimitedFishActivityAdvisor } from '../QuotaLimitedFishActivityAdvisor';

const local = new LocalFishActivityAdvisor();
/** Un faux agent IA qui répond comme l'algorithme local, mais avec source = 'ai'. */
const fakeAi = (): FishActivityAdvisor & { calls: number } => {
  const advisor = {
    calls: 0,
    async advise(context: Parameters<FishActivityAdvisor['advise']>[0]) {
      advisor.calls++;
      return { ...(await local.advise(context)), source: 'ai' as const, model: 'claude-test' };
    },
  };
  return advisor;
};

describe('QuotaLimitedFishActivityAdvisor', () => {
  it('utilise l’IA dans la limite du jour, puis l’estimation locale avec le message', async () => {
    const ai = fakeAi();
    const quota = new FreeQuota(new InMemoryUsageRepository(), () => new Date(2026, 10, 23), { 'fish-activity': 2, 'species-recognition': 2 });
    const advisor = new QuotaLimitedFishActivityAdvisor(ai, local, quota);

    expect((await advisor.advise(aContext())).source).toBe('ai');
    expect((await advisor.advise(aContext())).source).toBe('ai');
    const third = await advisor.advise(aContext());

    expect(ai.calls).toBe(2);
    expect(third.source).toBe('local');
    expect(third.freeLimitReached).toBe(true);
    expect(third.fallbackReason).toContain('version payante');
  });

  it('ne décompte pas un repli local (agent injoignable)', async () => {
    const quota = new FreeQuota(new InMemoryUsageRepository(), () => new Date(2026, 10, 23));
    const advisor = new QuotaLimitedFishActivityAdvisor(local, local, quota);
    await advisor.advise(aContext());
    expect(await quota.remaining('fish-activity')).toBe(quota.limit('fish-activity'));
  });
});
