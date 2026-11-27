import Ionicons from '@expo/vector-icons/Ionicons';
import { useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
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
  const { t } = useI18n();
  const { uiState, filter, savedSpot, locateMe, openMenu, createSpot, openSpot, showAllSpots } =
    useHomeViewModel();
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
            // Après un enregistrement, la carte (recréée au retour) s'ouvre centrée sur le nouveau spot.
            initialCamera={savedSpot ? { center: savedSpot.coordinates, zoom: 15 } : cameraRef.current}
            userPosition={uiState.userPosition}
            onSpotPress={openSpot}
            onCameraChange={(camera) => {
              cameraRef.current = camera;
            }}
          />
        )}

        <View style={styles.topOverlay} pointerEvents="box-none">
          {onlyMine && <FilterChip label={t('home.mySpotsCount', { count: uiState.spots.length })} onClear={showAllSpots} />}

          {savedSpot && (
            <View accessibilityRole="alert" style={[styles.banner, styles.savedBanner]}>
              <Ionicons name="checkmark-circle" size={20} color={colors.surface} />
              <Text style={[styles.bannerText, styles.savedText]}>
                <Text style={styles.savedStrong}>{t('home.saved')}</Text>
                {t('home.savedHint')}
              </Text>
            </View>
          )}
          {uiState.isLoading && (
            <View style={styles.banner}>
              <ActivityIndicator color={colors.primary} />
              <Text style={styles.bannerText}>{t('home.loading')}</Text>
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
                {onlyMine ? t('home.emptyMine') : t('home.empty')}
              </Text>
            </View>
          )}
        </View>

        <View style={styles.legend}>
          <MapLegend onlyMine={onlyMine} />
        </View>
        <IconButton icon="locate" accessibilityLabel={t('home.locate')} onPress={locateMe} style={styles.locate} />
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
  savedBanner: { backgroundColor: colors.mine },
  savedText: { color: colors.surface },
  savedStrong: { fontFamily: fonts.bodyBold },
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
