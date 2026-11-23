import type { FishingForecast } from '../domain/entities/FishingForecast';
import type { ForecastContext } from '../domain/entities/ForecastContext';
import type { FishActivityAdvisor } from '../domain/ports/FishActivityAdvisor';
import { fromAiResponse, toAiRequest } from './aiForecastContract';

/**
 * L'AGENT IA, vu depuis l'app : un appel HTTP vers NOTRE serveur
 * (server/fish-activity-agent), qui garde la clé de l'API Claude.
 * La clé n'est jamais dans l'application : n'importe qui pourrait l'extraire du téléphone.
 */
export class RemoteAiFishActivityAdvisor implements FishActivityAdvisor {
  constructor(
    private readonly baseUrl: string,
    private readonly fetchFn: typeof fetch = fetch,
    /** Le modèle réfléchit avant de répondre : on lui laisse jusqu'à 60 s. */
    private readonly timeoutMs = 60_000,
  ) {}

  async advise(context: ForecastContext): Promise<FishingForecast> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const response = await this.fetchFn(`${this.baseUrl.replace(/\/$/, '')}/forecast`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-spot-client': 'spot-app/1' },
        body: JSON.stringify(toAiRequest(context)),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error(`Agent IA : réponse ${response.status}`);
      return fromAiResponse(await response.json(), context);
    } finally {
      clearTimeout(timer);
    }
  }
}
