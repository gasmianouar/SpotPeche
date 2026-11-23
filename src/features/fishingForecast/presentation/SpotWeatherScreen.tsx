import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { moonPhase } from '@/features/weather/domain/services/moonPhase';
import { formatClock } from '@/features/weather/presentation/weatherFormat';
import { IconButton } from '@/shared/ui/IconButton';

import { CompactCurrentWeather } from './components/CompactCurrentWeather';
import { CompactHourlyStrip } from './components/CompactHourlyStrip';
import { FishActivityChart } from './components/FishActivityChart';
import { FishingIndexPanel } from './components/FishingIndexPanel';
import { useSpotWeatherViewModel } from './useSpotWeatherViewModel';

/**
 * VUE « Météo du spot » (écran 5a de la maquette) : un écran dédié, ouvert depuis la fiche.
 * Seulement aujourd'hui (pas de prévisions sur plusieurs jours).
 */
export function SpotWeatherScreen({ spotId }: { spotId: string }) {
  const { uiState, coordinates, retry, rate, back } = useSpotWeatherViewModel(spotId);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Retour à la fiche du spot" onPress={back} />
        <View style={styles.headerTexts}>
          <Text accessibilityRole="header" style={styles.title}>
            Météo du spot
          </Text>
          <View style={styles.placeRow}>
            <Ionicons name="location" size={13} color={colors.muted} />
            <Text style={styles.place} numberOfLines={1}>
              {coordinates
                ? `GPS du spot · ${coordinates.latitude.toFixed(4)}, ${coordinates.longitude.toFixed(4)}`
                : 'Localisation du spot…'}
            </Text>
          </View>
        </View>
      </View>

      {uiState.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>Récupération de la météo du spot…</Text>
        </View>
      )}

      {uiState.status === 'error' && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={44} color={colors.muted} />
          <Text accessibilityRole="alert" style={styles.message}>
            {uiState.message}
          </Text>
          <Pressable accessibilityRole="button" onPress={retry} style={styles.retry}>
            <Text style={styles.retryLabel}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {uiState.status === 'ready' && (
        <ScrollView contentContainerStyle={styles.content}>
          <CompactCurrentWeather current={uiState.conditions.weather.current} />
          <CompactHourlyStrip hours={uiState.conditions.weather.hourly} />
          <FishingIndexPanel
            forecast={uiState.conditions.fishing}
            reliability={uiState.conditions.reliability}
            myRating={uiState.conditions.myRating}
            onRate={rate}
          />
          <FishActivityChart forecast={uiState.conditions.fishing} isAnalyzing={uiState.isAnalyzing} />

          <View style={styles.twoColumns}>
            {uiState.conditions.weather.daily[0] && (
              <View style={styles.smallCard}>
                <Text style={styles.smallLabel}>Lever / coucher</Text>
                <Text style={styles.smallValue}>
                  {formatClock(uiState.conditions.weather.daily[0].sunrise)} ·{' '}
                  {formatClock(uiState.conditions.weather.daily[0].sunset)}
                </Text>
              </View>
            )}
            <View style={styles.smallCard}>
              <Text style={styles.smallLabel}>Lune</Text>
              <Text style={styles.smallValue}>{moonPhase(new Date()).name}</Text>
            </View>
          </View>
          <Text style={styles.credit}>Données météo : Open-Meteo.com</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTexts: { flex: 1 },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  place: { flex: 1, fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  message: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  retry: { minHeight: 44, paddingHorizontal: spacing.xl, borderRadius: radius.md, backgroundColor: colors.primary, justifyContent: 'center' },
  retryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  content: { padding: spacing.lg, paddingTop: spacing.md, gap: 10 },
  twoColumns: { flexDirection: 'row', gap: 10 },
  smallCard: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 14, gap: 2 },
  smallLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  smallValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  credit: { fontFamily: fonts.body, fontSize: 11, color: colors.muted, textAlign: 'center' },
});
