import { aContext, anHour, aWeather } from '../../testing/forecastTestData';
import { bestWindowOf, computeLocalForecast } from '../services/localFishActivityModel';

describe('algorithme local d’activité des poissons', () => {
  it('donne une activité par heure : forte à l’aube et au crépuscule, moyenne en journée', () => {
    const forecast = computeLocalForecast(aContext()); // lever 8:10, coucher 17:00
    const at = (hour: string) => forecast.hourly.find((h) => h.localTime.slice(11, 13) === hour)!;

    expect(forecast.hourly).toHaveLength(12);
    expect(forecast.source).toBe('local');
    expect(forecast.model).toBeNull();
    expect(at('08').level).toBe('good');
    expect(at('16').level).toBe('good');
    expect(at('12').level).toBe('medium');
    expect(at('16').score).toBeGreaterThan(at('12').score);
    expect(forecast.bestWindow?.start).toBe('2026-11-23T08:00');
  });

  it('le grand soleil de midi fait baisser l’activité', () => {
    const sunnyNoon = aWeather();
    const hourly = sunnyNoon.hourly.map((h) => (h.localTime.endsWith('12:00') ? { ...h, condition: 'clear' as const } : h));
    const forecast = computeLocalForecast(aContext({ weather: { ...sunnyNoon, hourly } }));
    const noon = forecast.hourly.find((h) => h.localTime.endsWith('12:00'));
    const overcast13 = forecast.hourly.find((h) => h.localTime.endsWith('13:00'));

    expect(noon!.score).toBeLessThan(overcast13!.score);
  });

  it('un orage rend l’heure déconseillée et le dit dans les raisons', () => {
    const weather = aWeather();
    const hourly = weather.hourly.map((h, i) => (i === 8 ? { ...h, condition: 'storm' as const } : h));
    const forecast = computeLocalForecast(aContext({ weather: { ...weather, hourly } }));

    expect(forecast.hourly[8].score).toBeLessThanOrEqual(5);
    expect(forecast.hourly[8].level).toBe('none');
    expect(forecast.index.reasons[0]).toBe('Orage : pêche déconseillée');
  });

  it('une baisse lente de la pression active les poissons', () => {
    const falling = aWeather({
      hourly: Array.from({ length: 12 }, (_, i) =>
        anHour(`2026-11-23T${String(8 + i).padStart(2, '0')}:00`, { pressure: 1018 - i * 0.6 }),
      ),
    });
    const stable = computeLocalForecast(aContext());
    const dropping = computeLocalForecast(aContext({ weather: falling }));

    expect(dropping.hourly[2].score).toBeGreaterThan(stable.hourly[2].score);
    expect(dropping.index.reasons).toContain('Pression en légère baisse');
  });

  it('les avis « ça mord bien » du spot remontent légèrement les scores', () => {
    const neutral = computeLocalForecast(aContext());
    const liked = computeLocalForecast(
      aContext({
        community: { activityVotes: { good: 5, medium: 0, none: 0 }, reliability: { reliable: 0, soSo: 0, wrong: 0 } },
      }),
    );

    expect(liked.hourly[3].score).toBe(Math.min(100, neutral.hourly[3].score + 5));
  });

  it('la confiance baisse quand les pêcheurs ont jugé l’indice peu fiable', () => {
    const forecast = computeLocalForecast(
      aContext({
        community: { activityVotes: { good: 0, medium: 0, none: 0 }, reliability: { reliable: 1, soSo: 0, wrong: 4 } },
      }),
    );

    expect(forecast.confidence).toBe('low');
  });

  it('l’indice reste entre 1 et 5', () => {
    const forecast = computeLocalForecast(aContext());

    expect(forecast.index.score).toBeGreaterThanOrEqual(1);
    expect(forecast.index.score).toBeLessThanOrEqual(5);
  });

  it('pas de meilleur créneau quand tout est faible', () => {
    expect(bestWindowOf([{ localTime: '2026-11-23T10:00', score: 30, level: 'none' }])).toBeNull();
  });
});
