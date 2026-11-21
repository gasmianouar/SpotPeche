import { DEFAULT_POSITION, type LocationService, type PlaceNameResolver } from '@/core/location/LocationService';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { Forecast } from '../entities/Weather';
import type { WeatherRepository } from '../repositories/WeatherRepository';
import { GetLocalWeather } from '../usecases/GetLocalWeather';

// Les tests remplacent le GPS, le géocodage et l'API par des faux :
// c'est possible parce que le cas d'usage ne dépend que d'interfaces.
jest.mock('expo-location', () => ({}));

const FORECAST: Forecast = {
  current: { temperature: 14, apparentTemperature: 13, condition: 'clear', windSpeed: 10, windDirection: 0, pressure: 1015, humidity: 60 },
  hourly: [],
  daily: [],
};

class FakeWeather implements WeatherRepository {
  requested: Coordinates | null = null;
  async getForecast(c: Coordinates) {
    this.requested = c;
    return FORECAST;
  }
}

const location = (position: Coordinates | null): LocationService => ({ getCurrentPosition: async () => position });
const resolver = (name: string | null): PlaceNameResolver => ({ getCityName: async () => name });

describe('GetLocalWeather', () => {
  it('utilise la position GPS et le nom de la ville', async () => {
    const weather = new FakeWeather();
    const lyon = { latitude: 45.764, longitude: 4.8357 };

    const result = await new GetLocalWeather(location(lyon), resolver('Lyon'), weather).execute();

    expect(weather.requested).toEqual(lyon);
    expect(result.place).toEqual({ name: 'Lyon', coordinates: lyon, isFallback: false });
    expect(result.fishingIndex.score).toBeGreaterThanOrEqual(1);
  });

  it('se rabat sur la position par défaut si le GPS est refusé', async () => {
    const weather = new FakeWeather();

    const result = await new GetLocalWeather(location(null), resolver(null), weather).execute();

    expect(weather.requested).toEqual(DEFAULT_POSITION);
    expect(result.place.isFallback).toBe(true);
    expect(result.place.name).toBe('Position actuelle');
  });
});
