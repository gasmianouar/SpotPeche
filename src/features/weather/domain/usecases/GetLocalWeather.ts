import { DEFAULT_POSITION, type LocationService, type PlaceNameResolver } from '@/core/location/LocationService';

import type { Forecast, Place } from '../entities/Weather';
import type { WeatherRepository } from '../repositories/WeatherRepository';
import { computeFishingIndex, type FishingIndex } from '../services/fishingIndex';
import { moonPhase, type MoonPhaseName } from '../services/moonPhase';

export interface LocalWeather {
  readonly place: Place;
  readonly forecast: Forecast;
  readonly fishingIndex: FishingIndex;
  readonly moonPhase: MoonPhaseName;
}

/**
 * CAS D'USAGE : « la météo là où je suis ».
 *
 * 1. position GPS (ou position par défaut si refusée) ;
 * 2. nom de la ville correspondante ;
 * 3. prévisions pour ces coordonnées ;
 * 4. calculs métier : indice de pêche et phase de lune.
 *
 * Les étapes 2 et 3 partent en parallèle (Promise.all) : l'écran s'affiche plus vite.
 */
export class GetLocalWeather {
  constructor(
    private readonly locationService: LocationService,
    private readonly placeNameResolver: PlaceNameResolver,
    private readonly weatherRepository: WeatherRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(): Promise<LocalWeather> {
    const gpsPosition = await this.locationService.getCurrentPosition().catch(() => null);
    const coordinates = gpsPosition ?? DEFAULT_POSITION;

    const [cityName, forecast] = await Promise.all([
      this.placeNameResolver.getCityName(coordinates),
      this.weatherRepository.getForecast(coordinates),
    ]);

    return {
      place: { name: cityName ?? 'Position actuelle', coordinates, isFallback: gpsPosition === null },
      forecast,
      fishingIndex: computeFishingIndex(forecast),
      moonPhase: moonPhase(this.now()).name,
    };
  }
}
