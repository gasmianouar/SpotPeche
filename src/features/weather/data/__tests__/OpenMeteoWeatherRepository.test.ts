import { conditionFromWmoCode, mapOpenMeteoResponse, OpenMeteoWeatherRepository, type OpenMeteoResponse } from '../OpenMeteoWeatherRepository';

const DTO: OpenMeteoResponse = {
  current: {
    time: '2026-11-21T10:15',
    temperature_2m: 9.6,
    apparent_temperature: 7.1,
    relative_humidity_2m: 81,
    weather_code: 3,
    wind_speed_10m: 14.2,
    wind_direction_10m: 230,
    pressure_msl: 1012.4,
  },
  hourly: {
    time: ['2026-11-21T08:00', '2026-11-21T09:00', '2026-11-21T10:00', '2026-11-21T11:00'],
    temperature_2m: [7, 8, 9.5, 10.2],
    weather_code: [45, 3, 3, 61],
    pressure_msl: [1013, 1012.8, 1012.4, 1012],
    wind_speed_10m: [10, 12, 14, 18],
  },
  daily: {
    time: ['2026-11-21'],
    weather_code: [61],
    temperature_2m_max: [11.4],
    temperature_2m_min: [5.2],
    sunrise: ['2026-11-21T08:12'],
    sunset: ['2026-11-21T17:02'],
  },
};

describe('mapOpenMeteoResponse', () => {
  it('commence les prévisions horaires à l’heure actuelle', () => {
    const forecast = mapOpenMeteoResponse(DTO);
    expect(forecast.hourly.map((h) => h.localTime)).toEqual(['2026-11-21T10:00', '2026-11-21T11:00']);
    expect(forecast.hourly[1].condition).toBe('rain');
  });

  it('traduit les champs de l’API en entités du domaine', () => {
    const forecast = mapOpenMeteoResponse(DTO);
    expect(forecast.current).toEqual({
      temperature: 9.6,
      apparentTemperature: 7.1,
      condition: 'overcast',
      windSpeed: 14.2,
      windDirection: 230,
      pressure: 1012.4,
      humidity: 81,
    });
    expect(forecast.daily[0]).toMatchObject({ minTemperature: 5.2, maxTemperature: 11.4, sunrise: '2026-11-21T08:12' });
  });
});

describe('conditionFromWmoCode', () => {
  it.each([
    [0, 'clear'],
    [2, 'partlyCloudy'],
    [48, 'fog'],
    [53, 'drizzle'],
    [81, 'rain'],
    [75, 'snow'],
    [96, 'storm'],
  ])('code %i → %s', (code, expected) => {
    expect(conditionFromWmoCode(code)).toBe(expected);
  });
});

describe('OpenMeteoWeatherRepository', () => {
  it('appelle Open-Meteo avec les coordonnées et le fuseau automatique', async () => {
    const fakeFetch = jest.fn().mockResolvedValue({ ok: true, json: async () => DTO });
    const repository = new OpenMeteoWeatherRepository(fakeFetch as unknown as typeof fetch);

    await repository.getForecast({ latitude: 48.77781, longitude: 2.44551 });

    const url = new URL(fakeFetch.mock.calls[0][0]);
    expect(url.host).toBe('api.open-meteo.com');
    expect(url.searchParams.get('latitude')).toBe('48.7778');
    expect(url.searchParams.get('timezone')).toBe('auto');
  });

  it('signale une erreur si l’API répond en erreur', async () => {
    const fakeFetch = jest.fn().mockResolvedValue({ ok: false, status: 503 });
    const repository = new OpenMeteoWeatherRepository(fakeFetch as unknown as typeof fetch);

    await expect(repository.getForecast({ latitude: 0, longitude: 0 })).rejects.toThrow('503');
  });
});
