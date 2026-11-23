import type { Forecast } from '@/features/weather/domain/entities/Weather';
import type { Coordinates } from '@/shared/domain/Coordinates';

/** Avis des pêcheurs, pour que l'analyse tienne compte du terrain. */
export interface CommunitySignals {
  /** « Ça mord ? » : nombre d'avis par niveau. */
  readonly activityVotes: { readonly good: number; readonly medium: number; readonly none: number };
  /** « Indice fiable ? » : ce que les pêcheurs pensent des prévisions passées. */
  readonly reliability: { readonly reliable: number; readonly soSo: number; readonly wrong: number };
}

/** Tout ce qu'on sait du spot pour estimer l'activité des poissons. */
export interface ForecastContext {
  readonly spotId: string;
  readonly coordinates: Coordinates;
  readonly weather: Forecast;
  readonly moon: { readonly name: string; readonly ageInDays: number };
  /** Espèces signalées sur le spot (noms français). */
  readonly species: readonly string[];
  readonly community: CommunitySignals;
}
