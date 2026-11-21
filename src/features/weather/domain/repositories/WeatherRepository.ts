import type { Coordinates } from '@/shared/domain/Coordinates';

import type { Forecast } from '../entities/Weather';

/** Contrat de la source météo (aujourd'hui Open-Meteo, demain une autre). */
export interface WeatherRepository {
  getForecast(coordinates: Coordinates): Promise<Forecast>;
}
