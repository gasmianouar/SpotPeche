import type { WeatherRepository } from '@/features/weather/domain/repositories/WeatherRepository';

import { InMemoryReliabilityRatingRepository } from '../../data/InMemoryReliabilityRatingRepository';
import { aWeather } from '../../testing/forecastTestData';
import type { FishingForecast } from '../entities/FishingForecast';
import type { ForecastContext } from '../entities/ForecastContext';
import type { FishActivityAdvisor } from '../ports/FishActivityAdvisor';
import { GetSpotFishingConditions } from '../usecases/GetSpotFishingConditions';
import { RateForecastReliability } from '../usecases/RateForecastReliability';

const FAKE_FORECAST: FishingForecast = {
  index: { score: 4, label: 'Bon', summary: 'Ok', reasons: [] },
  hourly: [],
  bestWindow: null,
  confidence: 'high',
  source: 'ai',
  model: 'claude-fable-5-2',
};

describe('GetSpotFishingConditions', () => {
  it('donne à l’agent la météo du spot, la lune, les espèces et les avis des pêcheurs', async () => {
    const weatherRepository: WeatherRepository = { getForecast: jest.fn().mockResolvedValue(aWeather()) };
    let received: ForecastContext | null = null;
    const advisor: FishActivityAdvisor = {
      advise: async (context) => {
        received = context;
        return FAKE_FORECAST;
      },
    };
    const ratings = new InMemoryReliabilityRatingRepository([
      { spotId: 's1', userId: 'u1', value: 'reliable' },
      { spotId: 's1', userId: 'me', value: 'wrong' },
      { spotId: 's2', userId: 'u2', value: 'wrong' },
    ]);
    const useCase = new GetSpotFishingConditions(weatherRepository, advisor, advisor, ratings, () => new Date(2026, 10, 23));

    const result = await useCase.execute(
      {
        id: 's1',
        coordinates: { latitude: 48.78, longitude: 2.44 },
        species: ['Brochet'],
        activityVotes: { good: 3, medium: 1, none: 0 },
      },
      'me',
    );

    expect(weatherRepository.getForecast).toHaveBeenCalledWith({ latitude: 48.78, longitude: 2.44 });
    expect(received).toMatchObject({
      spotId: 's1',
      species: ['Brochet'],
      community: { activityVotes: { good: 3, medium: 1, none: 0 }, reliability: { reliable: 1, soSo: 0, wrong: 1 } },
    });
    expect(received!.moon.name).toBeTruthy();
    expect(result.fishing).toBe(FAKE_FORECAST);
    expect(result.reliability).toEqual([
      { value: 'reliable', count: 1 },
      { value: 'so-so', count: 0 },
      { value: 'wrong', count: 1 },
    ]);
    expect(result.myRating).toBe('wrong');
  });
});

describe('GetSpotFishingConditions : aperçu instantané puis analyse IA', () => {
  it('envoie d’abord l’estimation locale, puis renvoie celle de l’agent', async () => {
    const weatherRepository: WeatherRepository = { getForecast: jest.fn().mockResolvedValue(aWeather()) };
    const local: FishActivityAdvisor = { advise: async () => ({ ...FAKE_FORECAST, source: 'local', model: null }) };
    const ai: FishActivityAdvisor = { advise: async () => FAKE_FORECAST };
    const useCase = new GetSpotFishingConditions(weatherRepository, ai, local, new InMemoryReliabilityRatingRepository());
    const previews: string[] = [];

    const result = await useCase.execute(
      { id: 's1', coordinates: { latitude: 1, longitude: 2 }, species: [], activityVotes: { good: 0, medium: 0, none: 0 } },
      'me',
      (preview) => previews.push(preview.fishing.source),
    );

    expect(previews).toEqual(['local']);
    expect(result.fishing.source).toBe('ai');
  });
});

describe('RateForecastReliability', () => {
  it('donne, change puis retire son avis', async () => {
    const repository = new InMemoryReliabilityRatingRepository();
    const useCase = new RateForecastReliability(repository);

    expect(await useCase.execute('s1', 'me', 'reliable')).toBe('reliable');
    expect(await useCase.execute('s1', 'me', 'wrong')).toBe('wrong');
    expect(await useCase.execute('s1', 'me', 'wrong')).toBeNull();
    expect(await repository.listForSpot('s1')).toEqual([]);
    await expect(useCase.execute('s1', 'me', 'génial')).rejects.toThrow();
  });
});
