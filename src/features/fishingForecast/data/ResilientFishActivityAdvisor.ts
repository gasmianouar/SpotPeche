import type { FishingForecast } from '../domain/entities/FishingForecast';
import type { ForecastContext } from '../domain/entities/ForecastContext';
import type { FishActivityAdvisor } from '../domain/ports/FishActivityAdvisor';

/**
 * DÉCORATEUR « repli automatique » : on demande à l'agent IA ;
 * s'il échoue (hors connexion, serveur absent, réponse invalide), l'algorithme local répond.
 * L'écran n'est jamais vide, et il sait d'où vient le résultat (source + fallbackReason).
 */
export class ResilientFishActivityAdvisor implements FishActivityAdvisor {
  constructor(
    private readonly primary: FishActivityAdvisor,
    private readonly fallback: FishActivityAdvisor,
  ) {}

  async advise(context: ForecastContext): Promise<FishingForecast> {
    try {
      return await this.primary.advise(context);
    } catch {
      const local = await this.fallback.advise(context);
      return { ...local, fallbackReason: 'Agent IA injoignable : estimation locale.' };
    }
  }
}
