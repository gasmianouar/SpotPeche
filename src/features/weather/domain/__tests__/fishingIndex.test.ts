import type { Forecast, HourlyForecast } from '../entities/Weather';
import { computeFishingIndex } from '../services/fishingIndex';

const hours = (pressures: number[]): HourlyForecast[] =>
  pressures.map((pressure, i) => ({ localTime: `2026-11-21T1${i}:00`, temperature: 12, condition: 'overcast', pressure, windSpeed: 10 }));

const forecast = (overrides: { pressures: number[]; wind: number; condition?: Forecast['current']['condition'] }): Forecast => ({
  current: {
    temperature: 12,
    apparentTemperature: 10,
    condition: overrides.condition ?? 'overcast',
    windSpeed: overrides.wind,
    windDirection: 225,
    pressure: overrides.pressures[0],
    humidity: 70,
  },
  hourly: hours(overrides.pressures),
  daily: [],
});

describe('computeFishingIndex', () => {
  it('donne « Excellent » avec une pression stable et peu de vent', () => {
    const index = computeFishingIndex(forecast({ pressures: [1016, 1016, 1016.2, 1016.4], wind: 8 }));
    expect(index.score).toBe(5);
    expect(index.label).toBe('Excellent');
  });

  it('baisse la note si la pression chute vite et que le vent est fort', () => {
    const index = computeFishingIndex(forecast({ pressures: [1016, 1014, 1013, 1011], wind: 40 }));
    expect(index.score).toBe(1);
    expect(index.reasons).toEqual(['Pression en forte baisse', 'Vent fort']);
  });

  it('déconseille toujours la pêche par orage', () => {
    const index = computeFishingIndex(forecast({ pressures: [1016, 1016, 1016, 1016], wind: 5, condition: 'storm' }));
    expect(index.score).toBe(1);
  });
});
