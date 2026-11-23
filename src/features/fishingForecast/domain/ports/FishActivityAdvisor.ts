import type { FishingForecast } from '../entities/FishingForecast';
import type { ForecastContext } from '../entities/ForecastContext';

/**
 * PORT : « estime l'activité des poissons de ce spot ».
 * Plusieurs implémentations : l'agent IA (serveur), l'algorithme local,
 * et des « décorateurs » qui les combinent (repli automatique, cache).
 * Les écrans et le cas d'usage ne savent pas laquelle répond.
 */
export interface FishActivityAdvisor {
  advise(context: ForecastContext): Promise<FishingForecast>;
}
