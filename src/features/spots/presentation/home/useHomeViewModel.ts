import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { DEFAULT_POSITION } from '@/core/location/LocationService';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';
import { useDrawerStore } from '@/features/menu/presentation/drawerStore';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { MapSpot } from '../../domain/entities/Spot';
import type { SpotFilter } from '../../domain/usecases/GetMapSpots';

/** Centre par défaut de la carte tant que le GPS n'a pas répondu. */
export const DEFAULT_CENTER: Coordinates = DEFAULT_POSITION;

export interface HomeUiState {
  isLoading: boolean;
  spots: MapSpot[];
  errorMessage: string | null;
  /** Position de l'utilisateur, une fois qu'il a appuyé sur « Me localiser ». */
  userPosition: Coordinates | null;
}

/** VIEWMODEL de l'accueil : charge les spots et gère les actions de l'écran. */
export function useHomeViewModel() {
  const router = useRouter();
  const { getMapSpots, locationService } = useDependencies();
  const userId = useSessionStore((state) => state.user?.id ?? '');
  const openMenu = useDrawerStore((state) => state.open);

  // Le filtre vient de l'URL (/?filter=mine), posé par le menu « Mes spots ».
  const params = useLocalSearchParams<{ filter?: string }>();
  const filter: SpotFilter = params.filter === 'mine' ? 'mine' : 'all';

  const [uiState, setUiState] = useState<HomeUiState>({
    isLoading: true,
    spots: [],
    errorMessage: null,
    userPosition: null,
  });

  // useEffect : exécuté après l'affichage, et à nouveau si userId ou filter change.
  useEffect(() => {
    let cancelled = false; // évite de mettre à jour un écran déjà fermé
    setUiState((s) => ({ ...s, isLoading: true, errorMessage: null }));
    getMapSpots
      .execute(userId, filter)
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
  }, [getMapSpots, userId, filter]);

  const locateMe = useCallback(async () => {
    const position = await locationService.getCurrentPosition();
    if (!position) {
      Alert.alert('Position indisponible', 'Autorisez la localisation dans les réglages pour centrer la carte sur vous.');
      return;
    }
    setUiState((s) => ({ ...s, userPosition: position }));
  }, [locationService]);

  /** Quitte le mode « Mes spots » et réaffiche tous les spots. */
  const showAllSpots = useCallback(() => router.setParams({ filter: 'all' }), [router]);

  // Écrans prévus dans les prochains sprints : on affiche un message en attendant.
  const comingSoon = (feature: string) => Alert.alert(feature, 'Disponible dans un prochain sprint.');
  const createSpot = () => comingSoon('Création de spot');
  const openSpot = (mapSpot: MapSpot) => comingSoon(mapSpot.spot.name);

  return { uiState, filter, locateMe, openMenu, createSpot, openSpot, showAllSpots };
}
