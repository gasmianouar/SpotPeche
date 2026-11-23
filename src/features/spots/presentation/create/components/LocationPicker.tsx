import { Camera, Map, type CameraRef } from '@maplibre/maplibre-react-native';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import type { Coordinates } from '@/shared/domain/Coordinates';

import type { PositionSource } from '../spotDraftStore';

const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty';
const PIN_MINE = require('../../../../../../assets/map/pin-mine.png');

interface Props {
  initialCenter: Coordinates;
  coordinates: Coordinates | null;
  positionSource: PositionSource | null;
  accuracyMeters: number | null;
  isLocating: boolean;
  error?: string;
  onMapMoved: (coordinates: Coordinates) => void;
  /** Le doigt est sur la carte (true) ou l'a quittée (false) : l'écran bloque alors son défilement. */
  onMapTouch?: (touching: boolean) => void;
}

const toLngLat = (c: Coordinates): [number, number] => [c.longitude, c.latitude];

/**
 * Choix de l'emplacement : une petite carte avec une épingle fixe au centre.
 * - à l'ouverture, la position GPS exacte est cherchée automatiquement (source « gps ») : la carte s'y centre ;
 * - on peut ensuite déplacer la carte à la main → le centre devient la position (source « map »).
 */
export function LocationPicker({
  initialCenter,
  coordinates,
  positionSource,
  accuracyMeters,
  isLocating,
  error,
  onMapMoved,
  onMapTouch,
}: Props) {
  const cameraRef = useRef<CameraRef>(null);

  // Une position GPS vient d'arriver : la caméra s'y déplace.
  useEffect(() => {
    if (positionSource === 'gps' && coordinates) {
      cameraRef.current?.flyTo({ center: toLngLat(coordinates), zoom: 16, duration: 700 });
    }
  }, [positionSource, coordinates]);

  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.title}>
        Emplacement
      </Text>
      {/* Sans ça, un glissement vertical sur la carte ferait défiler la page au lieu de la carte. */}
      <View
        style={styles.mapBox}
        onTouchStart={() => onMapTouch?.(true)}
        onTouchEnd={() => onMapTouch?.(false)}
        onTouchCancel={() => onMapTouch?.(false)}
      >
        <Map
          style={StyleSheet.absoluteFill}
          mapStyle={MAP_STYLE_URL}
          logo={false}
          attribution={false}
          compass={false}
          onRegionDidChange={(event) => {
            // On ignore les déplacements faits par le code (flyTo vers le GPS) :
            // seule une action de l'utilisateur remplace la position exacte.
            if (!event.nativeEvent.userInteraction) return;
            const [longitude, latitude] = event.nativeEvent.center;
            onMapMoved({ latitude, longitude });
          }}
        >
          <Camera ref={cameraRef} initialViewState={{ center: toLngLat(initialCenter), zoom: 14 }} />
        </Map>
        {/* Épingle fixe au centre (vue React par-dessus la carte, pas un marqueur de la carte). */}
        <View pointerEvents="none" style={styles.centerPin}>
          <Image source={PIN_MINE} style={styles.pinImage} />
        </View>
        <Text style={styles.mapHint}>Déplacez la carte pour placer le spot</Text>
      </View>

      {isLocating && !coordinates ? (
        <View style={styles.locating} accessibilityLiveRegion="polite">
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.coordsEmpty}>Recherche de votre position GPS…</Text>
        </View>
      ) : (
        <Text style={[styles.coords, !coordinates && styles.coordsEmpty]}>
          {coordinates
            ? `${coordinates.latitude.toFixed(6)}, ${coordinates.longitude.toFixed(6)}` +
              (positionSource === 'gps'
                ? ` · GPS${accuracyMeters != null ? ` ±${Math.round(accuracyMeters)} m` : ''}`
                : ' · placé sur la carte')
            : 'Aucune position choisie'}
        </Text>
      )}
      {error && (
        <Text accessibilityRole="alert" style={styles.error}>
          {error}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: 10 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  mapBox: { height: 180, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.ground },
  centerPin: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    marginLeft: -18,
    marginTop: -44, // la pointe de l'épingle tombe exactement au centre
  },
  pinImage: { width: 36, height: 44 },
  mapHint: {
    position: 'absolute',
    left: 10,
    bottom: 10,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingVertical: 6,
    paddingHorizontal: 10,
    fontFamily: fonts.bodyMedium,
    fontSize: 12,
    color: colors.ink,
    overflow: 'hidden',
  },
  coords: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
  coordsEmpty: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.muted },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: '#B42318' },
  locating: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
