import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import type { ReliabilityValue } from '../domain/entities/ReliabilityRating';
import type { SpotFishingConditions } from '../domain/usecases/GetSpotFishingConditions';

export type SpotWeatherUiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | {
      status: 'ready';
      conditions: SpotFishingConditions;
      /** true pendant que l'agent IA réfléchit (l'estimation locale est déjà affichée). */
      isAnalyzing: boolean;
    };

/** VIEWMODEL de l'écran « Météo du spot ». */
export function useSpotWeatherViewModel(spotId: string) {
  const router = useRouter();
  const { getSpotDetail, getSpotFishingConditions, rateForecastReliability } = useDependencies();
  const userId = useSessionStore((s) => s.user?.id ?? '');
  const [uiState, setUiState] = useState<SpotWeatherUiState>({ status: 'loading' });
  const [coordinates, setCoordinates] = useState<{ latitude: number; longitude: number } | null>(null);
  // Évite d'afficher une réponse arrivée après qu'on a quitté l'écran ou relancé le chargement.
  const requestId = useRef(0);

  const load = useCallback(async () => {
    const id = ++requestId.current;
    const isCurrent = () => id === requestId.current;
    try {
      // 1. Le spot : coordonnées GPS, espèces, avis « ça mord ? ».
      const detail = await getSpotDetail.execute(spotId, userId);
      if (!isCurrent()) return;
      setCoordinates(detail.spot.coordinates);
      const votes = Object.fromEntries(detail.activityVotes.map((v) => [v.activity, v.count]));

      // 2. Météo + analyse : l'estimation locale s'affiche tout de suite, puis celle de l'agent IA.
      const conditions = await getSpotFishingConditions.execute(
        {
          id: detail.spot.id,
          coordinates: detail.spot.coordinates,
          species: detail.species.map((s) => s.name),
          activityVotes: { good: votes.good ?? 0, medium: votes.medium ?? 0, none: votes.none ?? 0 },
        },
        userId,
        (preview) => {
          if (isCurrent()) setUiState({ status: 'ready', conditions: preview, isAnalyzing: true });
        },
      );
      if (isCurrent()) setUiState({ status: 'ready', conditions, isAnalyzing: false });
    } catch {
      if (isCurrent()) {
        setUiState({ status: 'error', message: 'Impossible de récupérer la météo du spot. Vérifiez votre connexion.' });
      }
    }
  }, [getSpotDetail, getSpotFishingConditions, spotId, userId]);

  // Chargé quand l'écran devient visible. En le quittant, on ignore les réponses en retard.
  useFocusEffect(
    useCallback(() => {
      load();
      const ids = requestId;
      return () => {
        ids.current++;
      };
    }, [load]),
  );

  /** « Indice fiable ? » : on met à jour les compteurs sur place, sans relancer l'analyse (payante). */
  const rate = useCallback(
    async (value: ReliabilityValue) => {
      const mine = await rateForecastReliability.execute(spotId, userId, value);
      setUiState((state) => {
        if (state.status !== 'ready') return state;
        const previous = state.conditions.myRating;
        const reliability = state.conditions.reliability.map((r) => ({
          value: r.value,
          count: r.count - (r.value === previous ? 1 : 0) + (r.value === mine ? 1 : 0),
        }));
        return { ...state, conditions: { ...state.conditions, reliability, myRating: mine } };
      });
    },
    [rateForecastReliability, spotId, userId],
  );

  return { uiState, coordinates, retry: load, rate, back: () => router.back() };
}
