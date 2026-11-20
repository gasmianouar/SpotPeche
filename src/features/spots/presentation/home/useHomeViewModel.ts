import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { MapSpot } from '../../domain/entities/Spot';

/** Centre par défaut de la carte (lac de Créteil) tant que le GPS n'a pas répondu. */
export const DEFAULT_CENTER: Coordinates = { latitude: 48.7778, longitude: 2.4455 };

export interface HomeUiState {
  isLoading: boolean;
  spots: MapSpot[];
  errorMessage: string | null;
  /** Position de l'utilisateur, une fois qu'il a appuyé sur « Me localiser ». */
  userPosition: Coordinates | null;
}

/** VIEWMODEL de l'accueil : charge les spots et gère les actions de l'écran. */
export function useHomeViewModel() {
  const { getMapSpots, locationService } = useDependencies();
  const userId = useSessionStore((state) => state.user?.id ?? '');

  const [uiState, setUiState] = useState<HomeUiState>({
    isLoading: true,
    spots: [],
    errorMessage: null,
    userPosition: null,
  });

  // useEffect : exécuté après l'affichage, et à nouveau si userId change.
  useEffect(() => {
    let cancelled = false; // évite de mettre à jour un écran déjà fermé
    getMapSpots
      .execute(userId)
      .then((spots) => {
        if (!cancelled) setUiState((s) => ({ ...s, isLoading: false, spots }));
      })
      .catch(() => {
        if (!cancelled) {
          setUiState((s) => ({ ...s, isLoading: false, errorMessage: 'Impossible de charger les spots.' }));
        }
      });
    return () => {
      cancelled = true;
    };
  }, [getMapSpots, userId]);

  const locateMe = useCallback(async () => {
    const position = await locationService.getCurrentPosition();
    if (!position) {
      Alert.alert('Position indisponible', 'Autorisez la localisation dans les réglages pour centrer la carte sur vous.');
      return;
    }
    setUiState((s) => ({ ...s, userPosition: position }));
  }, [locationService]);

  // Écrans prévus dans les prochains sprints : on affiche un message en attendant.
  const comingSoon = (feature: string) => Alert.alert(feature, 'Disponible dans un prochain sprint.');
  const openMenu = () => comingSoon('Menu');
  const createSpot = () => comingSoon('Création de spot');
  const openSpot = (mapSpot: MapSpot) => comingSoon(mapSpot.spot.name);

  return { uiState, locateMe, openMenu, createSpot, openSpot };
}
