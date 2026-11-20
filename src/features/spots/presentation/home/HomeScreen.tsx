import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { HomeToolbar } from './components/HomeToolbar';
import { MapLegend } from './components/MapLegend';
import { SpotMap } from './components/SpotMap';
import { DEFAULT_CENTER, useHomeViewModel } from './useHomeViewModel';

/**
 * VUE de l'accueil (écran 2 de la maquette) : barre du haut + carte + légende.
 * La barre Accueil / Météo du bas est gérée par app/(tabs)/_layout.tsx.
 */
export function HomeScreen() {
  const { uiState, locateMe, openMenu, createSpot, openSpot } = useHomeViewModel();

  return (
    // edges={['top']} : la barre d'onglets gère déjà le bas de l'écran.
    <SafeAreaView edges={['top']} style={styles.screen}>
      <StatusBar style="dark" />
      <HomeToolbar onMenuPress={openMenu} onCreatePress={createSpot} />

      <View style={styles.mapArea}>
        <SpotMap
          spots={uiState.spots}
          initialCenter={DEFAULT_CENTER}
          userPosition={uiState.userPosition}
          onSpotPress={openSpot}
        />

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

        <View style={styles.legend}>
          <MapLegend />
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
  banner: {
    position: 'absolute',
    top: spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    ...floating,
  },
  bannerText: { fontFamily: fonts.bodyMedium, fontSize: 14, color: colors.ink },
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
