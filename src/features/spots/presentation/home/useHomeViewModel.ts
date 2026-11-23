import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
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

  // Paramètres de l'URL :
  // - filter=mine : posé par le menu « Mes spots » ;
  // - savedSpotId, lat, lon : posés par l'écran « Nouveau spot » après l'enregistrement.
  const params = useLocalSearchParams<{ filter?: string; savedSpotId?: string; lat?: string; lon?: string }>();
  const filter: SpotFilter = params.filter === 'mine' ? 'mine' : 'all';
  const savedSpot = toSavedSpot(params);

  const [uiState, setUiState] = useState<HomeUiState>({
    isLoading: true,
    spots: [],
    errorMessage: null,
    userPosition: null,
  });

  // useFocusEffect : exécuté chaque fois que l'accueil redevient visible
  // (au démarrage, mais aussi au retour de « Nouveau spot » → le nouveau marqueur apparaît).
  useFocusEffect(
    useCallback(() => {
      let cancelled = false; // évite de mettre à jour un écran déjà quitté
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
    }, [getMapSpots, userId, filter]),
  );

  // Bandeau « Spot enregistré » : visible tant que les paramètres sont dans l'URL.
  // Après 4 secondes on les efface : le bandeau disparaît (la carte, elle, reste où elle est).
  const savedSpotId = savedSpot?.id;
  useEffect(() => {
    if (!savedSpotId) return;
    const timer = setTimeout(() => router.setParams({ savedSpotId: undefined, lat: undefined, lon: undefined }), 4000);
    return () => clearTimeout(timer);
  }, [savedSpotId, router]);

  const locateMe = useCallback(async () => {
    // Sans try/catch, une localisation coupée faisait planter la promesse (« Uncaught in promise »).
    const position = await locationService.getCurrentPosition().catch(() => undefined);
    if (position === undefined) {
      Alert.alert('Position indisponible', 'Activez la localisation du téléphone, puis réessayez.');
      return;
    }
    if (!position) {
      Alert.alert('Position indisponible', 'Autorisez la localisation dans les réglages pour centrer la carte sur vous.');
      return;
    }
    setUiState((s) => ({ ...s, userPosition: position }));
  }, [locationService]);

  /** Quitte le mode « Mes spots » et réaffiche tous les spots. */
  const showAllSpots = useCallback(() => router.setParams({ filter: 'all' }), [router]);

  /** Bouton « + » : ouvre le parcours de création. */
  const createSpot = () => router.push('/nouveau-spot');

  /** Toucher un marqueur ouvre la fiche du spot. */
  const openSpot = (mapSpot: MapSpot) => router.push({ pathname: '/spot/[id]', params: { id: mapSpot.spot.id } });

  return { uiState, filter, savedSpot, locateMe, openMenu, createSpot, openSpot, showAllSpots };
}

export interface SavedSpot {
  id: string;
  coordinates: Coordinates;
}

/** Lit les paramètres posés après un enregistrement (ce sont des textes dans l'URL). */
function toSavedSpot(params: { savedSpotId?: string; lat?: string; lon?: string }): SavedSpot | null {
  const latitude = Number(params.lat);
  const longitude = Number(params.lon);
  if (!params.savedSpotId || !Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  return { id: params.savedSpotId, coordinates: { latitude, longitude } };
}
