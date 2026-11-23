import type { Forecast } from '@/features/weather/domain/entities/Weather';
import type { WeatherRepository } from '@/features/weather/domain/repositories/WeatherRepository';
import { moonPhase } from '@/features/weather/domain/services/moonPhase';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { FishingForecast } from '../entities/FishingForecast';
import type { CommunitySignals, ForecastContext } from '../entities/ForecastContext';
import { RELIABILITY_VALUES, type ReliabilityValue } from '../entities/ReliabilityRating';
import type { FishActivityAdvisor } from '../ports/FishActivityAdvisor';
import type { ReliabilityRatingRepository } from '../repositories/ReliabilityRatingRepository';

export interface SpotForForecast {
  readonly id: string;
  readonly coordinates: Coordinates;
  /** Espèces signalées sur le spot (noms français). */
  readonly species: readonly string[];
  /** Avis « ça mord ? » du spot. */
  readonly activityVotes: CommunitySignals['activityVotes'];
}

export interface ReliabilityCount {
  readonly value: ReliabilityValue;
  readonly count: number;
}

export interface SpotFishingConditions {
  readonly weather: Forecast;
  readonly fishing: FishingForecast;
  /** « Indice fiable ? » : les 3 avis possibles, toujours dans le même ordre. */
  readonly reliability: readonly ReliabilityCount[];
  readonly myRating: ReliabilityValue | null;
}

/**
 * CAS D'USAGE : « la météo et l'activité des poissons de ce spot ».
 *
 * 1. prévisions météo aux coordonnées GPS du spot ;
 * 2. phase de lune, espèces du spot, avis des pêcheurs (« ça mord ? », « indice fiable ? ») ;
 * 3. l'analyse est confiée au FishActivityAdvisor (agent IA, ou algorithme local en repli).
 *
 * L'agent IA met quelques secondes à répondre : si on fournit `onPreview`, on reçoit
 * d'abord l'estimation instantanée du `quickAdvisor` (algorithme local), puis l'analyse finale.
 */
export class GetSpotFishingConditions {
  constructor(
    private readonly weatherRepository: WeatherRepository,
    private readonly advisor: FishActivityAdvisor,
    private readonly quickAdvisor: FishActivityAdvisor,
    private readonly ratingRepository: ReliabilityRatingRepository,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async execute(
    spot: SpotForForecast,
    currentUserId: string,
    onPreview?: (preview: SpotFishingConditions) => void,
  ): Promise<SpotFishingConditions> {
    const [weather, ratings] = await Promise.all([
      this.weatherRepository.getForecast(spot.coordinates),
      this.ratingRepository.listForSpot(spot.id),
    ]);
    const count = (value: ReliabilityValue) => ratings.filter((r) => r.value === value).length;
    const moon = moonPhase(this.now());

    const context: ForecastContext = {
      spotId: spot.id,
      coordinates: spot.coordinates,
      weather,
      moon: { name: moon.name, ageInDays: moon.ageInDays },
      species: spot.species,
      community: {
        activityVotes: spot.activityVotes,
        reliability: { reliable: count('reliable'), soSo: count('so-so'), wrong: count('wrong') },
      },
    };
    const withFishing = (fishing: FishingForecast): SpotFishingConditions => ({
      weather,
      fishing,
      reliability: RELIABILITY_VALUES.map((value) => ({ value, count: count(value) })),
      myRating: ratings.find((r) => r.userId === currentUserId)?.value ?? null,
    });

    if (onPreview && this.quickAdvisor !== this.advisor) {
      onPreview(withFishing(await this.quickAdvisor.advise(context)));
    }
    return withFishing(await this.advisor.advise(context));
  }
}
