import { useCallback, useEffect, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import type { LocalWeather } from '../domain/usecases/GetLocalWeather';

/**
 * L'état de l'écran est une « union discriminée » : un seul champ `status`
 * dit dans quel cas on est, et TypeScript sait quelles données existent
 * dans chaque cas (impossible d'afficher `weather` pendant le chargement).
 */
export type WeatherUiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; weather: LocalWeather; isRefreshing: boolean };

/**
 * VIEWMODEL de l'écran Météo.
 * Sans coordonnées : là où je suis. Avec : à cet endroit (la météo d'un spot).
 */
export function useWeatherViewModel(latitude?: number, longitude?: number) {
  const { getLocalWeather } = useDependencies();
  const [uiState, setUiState] = useState<WeatherUiState>({ status: 'loading' });

  const load = useCallback(async () => {
    try {
      const at = latitude !== undefined && longitude !== undefined ? { latitude, longitude } : undefined;
      const weather = await getLocalWeather.execute(at);
      setUiState({ status: 'success', weather, isRefreshing: false });
    } catch {
      setUiState({
        status: 'error',
        message: 'Impossible de récupérer la météo. Vérifiez votre connexion internet.',
      });
    }
  }, [getLocalWeather, latitude, longitude]);

  useEffect(() => {
    load();
  }, [load]);

  /** « Tirer pour rafraîchir » : on garde l'ancienne météo affichée pendant le chargement. */
  const refresh = useCallback(() => {
    setUiState((s) => (s.status === 'success' ? { ...s, isRefreshing: true } : { status: 'loading' }));
    load();
  }, [load]);

  return { uiState, refresh };
}
