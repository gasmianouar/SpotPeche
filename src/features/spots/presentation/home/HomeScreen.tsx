import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { FilterChip } from './components/FilterChip';
import { HomeToolbar } from './components/HomeToolbar';
import { MapLegend } from './components/MapLegend';
import { SpotMap, type CameraState } from './components/SpotMap';
import { DEFAULT_CENTER, useHomeViewModel } from './useHomeViewModel';

/**
 * VUE de l'accueil (écran 2 de la maquette) : barre du haut + carte + légende.
 * En mode « Mes spots » (/?filter=mine), seule la carte de mes spots est affichée.
 * La barre Accueil / Météo du bas est gérée par app/(tabs)/_layout.tsx.
 */
export function HomeScreen() {
  const { uiState, filter, locateMe, openMenu, createSpot, openSpot, showAllSpots } = useHomeViewModel();
  const onlyMine = filter === 'mine';
  const isEmpty = !uiState.isLoading && !uiState.errorMessage && uiState.spots.length === 0;

  // true seulement quand l'onglet Accueil est affiché.
  const isFocused = useIsFocused();
  // Dernière position de la caméra : useRef garde la valeur sans redessiner l'écran.
  const cameraRef = useRef<CameraState>({ center: DEFAULT_CENTER, zoom: 13.5 });

  return (
    // edges={['top']} : la barre d'onglets gère déjà le bas de l'écran.
    <SafeAreaView edges={['top']} style={styles.screen}>
      <StatusBar style="dark" />
      <HomeToolbar onMenuPress={openMenu} onCreatePress={createSpot} />

      <View style={styles.mapArea}>
        {/* La carte n'existe que quand l'onglet est affiché : au retour depuis Météo,
            elle est recréée (marqueurs compris) à la dernière position de caméra. */}
        {isFocused && (
          <SpotMap
            spots={uiState.spots}
            initialCamera={cameraRef.current}
            userPosition={uiState.userPosition}
            onSpotPress={openSpot}
            onCameraChange={(camera) => {
              cameraRef.current = camera;
            }}
          />
        )}

        <View style={styles.topOverlay} pointerEvents="box-none">
          {onlyMine && <FilterChip label={`Mes spots (${uiState.spots.length})`} onClear={showAllSpots} />}

          {uiState.isLoading && (
            <View style={styles.banner}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.bannerText}>Chargement des spots…</Text>
            </View>
          )}
          {uiState.errorMessage && (
            <View style={styles.banner}>
              <Text accessibilityRole="alert" style={styles.bannerText}>
                {uiState.errorMessage}
              </Text>
            </View>
          )}
          {isEmpty && (
            <View style={styles.banner}>
              <Text style={styles.bannerText}>
                {onlyMine ? "Vous n'avez pas encore de spot. Touchez « + » pour en créer un." : 'Aucun spot pour le moment.'}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.legend}>
          <MapLegend onlyMine={onlyMine} />
        </View>
        <IconButton icon="locate" accessibilityLabel="Me localiser" onPress={locateMe} style={styles.locate} />
      </View>
    </SafeAreaView>
  );
}

const floating = {
  shadowColor: colors.ink,
  shadowOpacity: 0.14,
  shadowRadius: 12,
  shadowOffset: { width: 0, height: 4 },
  elevation: 4,
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.surface },
  mapArea: { flex: 1, backgroundColor: colors.ground },
  // pointerEvents="box-none" : la zone laisse passer les gestes vers la carte,
  // seuls ses enfants (pastille, bandeaux) captent le toucher.
  topOverlay: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.md,
    right: spacing.md,
    alignItems: 'center',
    gap: spacing.sm,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...floating,
  },
  bannerText: { flexShrink: 1, fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink, textAlign: 'center' },
  legend: { position: 'absolute', left: spacing.md, bottom: spacing.lg },
  locate: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.lg,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surface,
    ...floating,
  },
});
