import type { FishingForecast } from '../domain/entities/FishingForecast';
import type { ForecastContext } from '../domain/entities/ForecastContext';
import type { FishActivityAdvisor } from '../domain/ports/FishActivityAdvisor';
import { computeLocalForecast } from '../domain/services/localFishActivityModel';

/** L'algorithme local derrière le même contrat que l'agent IA : instantané et hors connexion. */
export class LocalFishActivityAdvisor implements FishActivityAdvisor {
  async advise(context: ForecastContext): Promise<FishingForecast> {
    return computeLocalForecast(context);
  }
}
