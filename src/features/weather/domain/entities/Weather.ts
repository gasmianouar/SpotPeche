import type { Coordinates } from '@/shared/domain/Coordinates';

/**
 * Les grandes familles de temps. Le domaine ne connaît pas les codes
 * numériques d'Open-Meteo : la traduction se fait dans la couche data.
 */
export type WeatherCondition =
  | 'clear'
  | 'partlyCloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'snow'
  | 'storm';

export interface CurrentWeather {
  readonly temperature: number; // °C
  readonly apparentTemperature: number; // °C ressentis
  readonly condition: WeatherCondition;
  readonly windSpeed: number; // km/h
  readonly windDirection: number; // degrés (0 = vent du nord)
  readonly pressure: number; // hPa, ramenée au niveau de la mer
  readonly humidity: number; // %
}

export interface HourlyForecast {
  /** Heure locale du lieu, format ISO sans fuseau : "2026-11-21T14:00". */
  readonly localTime: string;
  readonly temperature: number;
  readonly condition: WeatherCondition;
  readonly pressure: number;
  readonly windSpeed: number; // km/h
}

export interface DailyForecast {
  /** Date locale : "2026-11-21". */
  readonly localDate: string;
  readonly condition: WeatherCondition;
  readonly minTemperature: number;
  readonly maxTemperature: number;
  readonly sunrise: string; // "2026-11-21T08:02"
  readonly sunset: string;
}

/** Ce que renvoie la source météo pour des coordonnées. */
export interface Forecast {
  readonly current: CurrentWeather;
  /** Prévisions heure par heure à partir de l'heure actuelle. */
  readonly hourly: HourlyForecast[];
  /** Aujourd'hui en premier. */
  readonly daily: DailyForecast[];
}

/** Le lieu pour lequel on affiche la météo. */
export interface Place {
  readonly name: string;
  readonly coordinates: Coordinates;
  /** true si on n'a pas pu utiliser le GPS et qu'on montre le lieu par défaut. */
  readonly isFallback: boolean;
}
