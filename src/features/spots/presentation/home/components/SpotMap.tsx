import { Camera, Map, Marker, type CameraRef, type ViewState } from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { Image, StyleSheet, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors } from '@/core/theme/tokens';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { MapSpot } from '../../../domain/entities/Spot';

/**
 * Style de carte gratuit, sans clé d'API : OpenFreeMap (données OpenStreetMap),
 * affiché par MapLibre (open source). Aucun service Google.
 */
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Images des épingles (densités @2x/@3x choisies automatiquement par React Native). */
const PIN_MINE = require('../../../../../../assets/map/pin-mine.png');
const PIN_COMMUNITY = require('../../../../../../assets/map/pin-community.png');

/** Le domaine parle en {latitude, longitude} ; MapLibre attend [longitude, latitude]. */
const toLngLat = (c: Coordinates): [number, number] => [c.longitude, c.latitude];

/** Position de la caméra à mémoriser entre deux affichages de la carte. */
export interface CameraState {
  center: Coordinates;
  zoom: number;
}

interface Props {
  spots: MapSpot[];
  /** Où placer la caméra à l'ouverture (dernière position connue, ou position par défaut). */
  initialCamera: CameraState;
  userPosition: Coordinates | null;
  onSpotPress: (spot: MapSpot) => void;
  /** Appelé quand l'utilisateur a fini de déplacer la carte. */
  onCameraChange: (camera: CameraState) => void;
}

/**
 * La carte et ses spots.
 *
 * Chaque spot est un <Marker> : une vue React (ici l'image de l'épingle) posée sur
 * la carte. Sur Android, ces vues ne sont pas raccrochées quand l'onglet revient
 * au premier plan : HomeScreen recrée donc la carte à chaque retour sur l'onglet
 * (voir `useIsFocused`), et cette carte repart de la dernière position de caméra.
 */
export function SpotMap({ spots, initialCamera, userPosition, onSpotPress, onCameraChange }: Props) {
  const { t } = useI18n();
  const cameraRef = useRef<CameraRef>(null);

  // Quand une nouvelle position arrive, la caméra s'y déplace en douceur.
  useEffect(() => {
    if (userPosition) {
      cameraRef.current?.flyTo({ center: toLngLat(userPosition), zoom: 14, duration: 800 });
    }
  }, [userPosition]);

  const handleRegionDidChange = (state: ViewState) => {
    const [longitude, latitude] = state.center;
    onCameraChange({ center: { latitude, longitude }, zoom: state.zoom });
  };

  return (
    <Map
      style={styles.map}
      mapStyle={MAP_STYLE_URL}
      logo={false}
      attribution
      compass={false}
      onRegionDidChange={(event) => handleRegionDidChange(event.nativeEvent)}
    >
      <Camera
        ref={cameraRef}
        initialViewState={{ center: toLngLat(initialCamera.center), zoom: initialCamera.zoom }}
      />

      {spots.map((mapSpot) => (
        // Le toucher se règle sur le Marker lui-même : sur Android, la vue enfant
        // est posée sur la carte par MapLibre et ne reçoit pas les touchers (un Pressable n'y réagit pas).
        <Marker
          key={mapSpot.spot.id}
          id={mapSpot.spot.id}
          lngLat={toLngLat(mapSpot.spot.coordinates)}
          anchor="bottom"
          onPress={() => onSpotPress(mapSpot)}
        >
          <View
            accessible
            accessibilityRole="button"
            accessibilityLabel={t(mapSpot.isMine ? 'home.markerMine' : 'home.markerCommunity', { name: mapSpot.spot.name })}
          >
            <Image source={mapSpot.isMine ? PIN_MINE : PIN_COMMUNITY} style={styles.pin} />
          </View>
        </Marker>
      ))}

      {userPosition && (
        <Marker id="user-position" lngLat={toLngLat(userPosition)} anchor="center">
          <View accessibilityLabel={t('home.yourPosition')} style={styles.userDot} />
        </Marker>
      )}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  pin: { width: 36, height: 44 },
  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.userLocation,
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
