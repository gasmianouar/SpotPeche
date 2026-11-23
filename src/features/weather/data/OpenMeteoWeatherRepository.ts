import type { Coordinates } from '@/shared/domain/Coordinates';

import type { Forecast, WeatherCondition } from '../domain/entities/Weather';
import type { WeatherRepository } from '../domain/repositories/WeatherRepository';

/**
 * Source météo : Open-Meteo (https://open-meteo.com).
 * Gratuit et sans clé pour un usage non commercial. Si Spot devient payante,
 * il faudra un abonnement et une clé (on ne changera que cette classe).
 */
const BASE_URL = 'https://api.open-meteo.com/v1/forecast';
const HOURS_SHOWN = 12; // assez pour couvrir la journée de pêche (aube ou crépuscule)

/**
 * DTO (Data Transfer Object) : la forme EXACTE du JSON renvoyé par l'API.
 * On ne l'expose jamais hors de la couche data : si l'API change,
 * seul le « mapper » ci-dessous est à adapter.
 */
export interface OpenMeteoResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    pressure_msl: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    pressure_msl: number[];
    wind_speed_10m: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
  };
}

export class OpenMeteoWeatherRepository implements WeatherRepository {
  /** `fetch` est injecté pour pouvoir le remplacer par un faux dans les tests. */
  constructor(private readonly fetchFn: typeof fetch = fetch) {}

  async getForecast({ latitude, longitude }: Coordinates): Promise<Forecast> {
    const params = new URLSearchParams({
      latitude: latitude.toFixed(4),
      longitude: longitude.toFixed(4),
      current:
        'temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,pressure_msl',
      hourly: 'temperature_2m,weather_code,pressure_msl,wind_speed_10m',
      daily: 'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset',
      timezone: 'auto', // heures dans le fuseau du lieu
      forecast_days: '6',
    });

    const response = await this.fetchFn(`${BASE_URL}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`Open-Meteo a répondu ${response.status}`);
    }
    return mapOpenMeteoResponse((await response.json()) as OpenMeteoResponse);
  }
}

/** MAPPER : JSON de l'API → entités du domaine. Fonction pure, testée. */
export function mapOpenMeteoResponse(dto: OpenMeteoResponse): Forecast {
  // Première heure de la liste = heure actuelle (on tronque « 14:15 » en « 14:00 »).
  const currentHour = dto.current.time.slice(0, 13) + ':00';
  const start = Math.max(0, dto.hourly.time.indexOf(currentHour));

  return {
    current: {
      temperature: dto.current.temperature_2m,
      apparentTemperature: dto.current.apparent_temperature,
      condition: conditionFromWmoCode(dto.current.weather_code),
      windSpeed: dto.current.wind_speed_10m,
      windDirection: dto.current.wind_direction_10m,
      pressure: dto.current.pressure_msl,
      humidity: dto.current.relative_humidity_2m,
    },
    hourly: dto.hourly.time.slice(start, start + HOURS_SHOWN).map((localTime, i) => ({
      localTime,
      temperature: dto.hourly.temperature_2m[start + i],
      condition: conditionFromWmoCode(dto.hourly.weather_code[start + i]),
      pressure: dto.hourly.pressure_msl[start + i],
      windSpeed: dto.hourly.wind_speed_10m?.[start + i] ?? dto.current.wind_speed_10m,
    })),
    daily: dto.daily.time.map((localDate, i) => ({
      localDate,
      condition: conditionFromWmoCode(dto.daily.weather_code[i]),
      minTemperature: dto.daily.temperature_2m_min[i],
      maxTemperature: dto.daily.temperature_2m_max[i],
      sunrise: dto.daily.sunrise[i],
      sunset: dto.daily.sunset[i],
    })),
  };
}

/** Codes météo WMO (norme utilisée par Open-Meteo) → familles du domaine. */
export function conditionFromWmoCode(code: number): WeatherCondition {
  if (code === 0) return 'clear';
  if (code <= 2) return 'partlyCloudy';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 51 && code <= 57) return 'drizzle';
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return 'rain';
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return 'snow';
  if (code >= 95) return 'storm';
  return 'overcast';
}
