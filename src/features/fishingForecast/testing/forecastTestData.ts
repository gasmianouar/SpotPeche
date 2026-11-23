import type { Forecast, HourlyForecast } from '@/features/weather/domain/entities/Weather';

import type { ForecastContext } from '../domain/entities/ForecastContext';

/** Une heure de prévision (valeurs neutres + ce qui change). */
export const anHour = (localTime: string, overrides: Partial<HourlyForecast> = {}): HourlyForecast => ({
  localTime,
  temperature: 10,
  condition: 'overcast',
  pressure: 1015,
  windSpeed: 10,
  ...overrides,
});

/** 12 heures à partir de 8h, coucher du soleil à 17:00. */
export function aWeather(overrides: Partial<Forecast> = {}): Forecast {
  const hourly = Array.from({ length: 12 }, (_, i) => anHour(`2026-11-23T${String(8 + i).padStart(2, '0')}:00`));
  return {
    current: { temperature: 10, apparentTemperature: 8, condition: 'overcast', windSpeed: 10, windDirection: 200, pressure: 1015, humidity: 70 },
    hourly,
    daily: [
      {
        localDate: '2026-11-23',
        condition: 'overcast',
        minTemperature: 5,
        maxTemperature: 11,
        sunrise: '2026-11-23T08:10',
        sunset: '2026-11-23T17:00',
      },
    ],
    ...overrides,
  };
}

export function aContext(overrides: Partial<ForecastContext> = {}): ForecastContext {
  return {
    spotId: 's1',
    coordinates: { latitude: 48.7812, longitude: 2.4455 },
    weather: aWeather(),
    moon: { name: 'Premier quartier', ageInDays: 7 },
    species: ['Brochet', 'Perche'],
    community: {
      activityVotes: { good: 0, medium: 0, none: 0 },
      reliability: { reliable: 0, soSo: 0, wrong: 0 },
    },
    ...overrides,
  };
}
