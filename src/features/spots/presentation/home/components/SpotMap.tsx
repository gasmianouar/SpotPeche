import { Camera, Map, Marker, type CameraRef, type LngLat } from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { colors } from '@/core/theme/tokens';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { MapSpot } from '../../../domain/entities/Spot';
import { SpotMarker } from './SpotMarker';

/**
 * Style de carte gratuit, sans clé d'API : OpenFreeMap (données OpenStreetMap),
 * affiché par MapLibre (open source). Aucun service Google.
 */
const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';

/** Le domaine parle en {latitude, longitude} ; MapLibre attend [longitude, latitude]. */
const toLngLat = (c: Coordinates): LngLat => [c.longitude, c.latitude];

interface Props {
  spots: MapSpot[];
  initialCenter: Coordinates;
  userPosition: Coordinates | null;
  onSpotPress: (spot: MapSpot) => void;
}

export function SpotMap({ spots, initialCenter, userPosition, onSpotPress }: Props) {
  const cameraRef = useRef<CameraRef>(null);

  // Quand une nouvelle position arrive, la caméra s'y déplace en douceur.
  useEffect(() => {
    if (userPosition) {
      cameraRef.current?.flyTo({ center: toLngLat(userPosition), zoom: 14, duration: 800 });
    }
  }, [userPosition]);

  return (
    <Map style={styles.map} mapStyle={MAP_STYLE_URL} logo={false} attribution compass={false}>
      <Camera ref={cameraRef} initialViewState={{ center: toLngLat(initialCenter), zoom: 13.5 }} />

      {spots.map((mapSpot) => (
        <Marker key={mapSpot.spot.id} id={mapSpot.spot.id} lngLat={toLngLat(mapSpot.spot.coordinates)} anchor="bottom">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${mapSpot.isMine ? 'Mon spot' : 'Spot de la communauté'} : ${mapSpot.spot.name}`}
            onPress={() => onSpotPress(mapSpot)}
          >
            <SpotMarker isMine={mapSpot.isMine} />
          </Pressable>
        </Marker>
      ))}

      {userPosition && (
        <Marker id="user-position" lngLat={toLngLat(userPosition)} anchor="center">
          <View accessibilityLabel="Votre position" style={styles.userDot} />
        </Marker>
      )}
    </Map>
  );
}

const styles = StyleSheet.create({
  map: { flex: 1 },
  userDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.userLocation,
    borderWidth: 3,
    borderColor: colors.surface,
  },
});
