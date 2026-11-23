import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { Card } from './components/Card';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { DailyForecastList } from './components/DailyForecastList';
import { FishingIndexCard } from './components/FishingIndexCard';
import { HourlyForecastStrip } from './components/HourlyForecastStrip';
import { useWeatherViewModel } from './useWeatherViewModel';
import { formatClock } from './weatherFormat';

interface Props {
  /** Météo d'un lieu précis (un spot) ; sans coordonnées : là où je suis. */
  latitude?: number;
  longitude?: number;
  /** Affiche une flèche retour (ouverture depuis la fiche d'un spot). */
  onBack?: () => void;
}

/** VUE de l'écran Météo (écran 4 de la maquette). */
export function WeatherScreen({ latitude, longitude, onBack }: Props = {}) {
  const { uiState, refresh } = useWeatherViewModel(latitude, longitude);
  const weather = uiState.status === 'success' ? uiState.weather : null;
  // Météo d'un spot : on montre ses coordonnées GPS, et l'indice de pêche passe sous l'horaire.
  const isSpot = latitude !== undefined && longitude !== undefined;
  const placeLabel = isSpot
    ? `GPS du spot · ${latitude.toFixed(4)}, ${longitude.toFixed(4)}`
    : weather
      ? weather.place.name
      : 'Localisation…';

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={[styles.header, onBack && styles.headerWithBack]}>
        {onBack && <IconButton icon="chevron-back" accessibilityLabel="Retour" onPress={onBack} />}
        <View>
          <Text accessibilityRole="header" style={styles.title}>
            {onBack ? 'Météo du spot' : 'Météo'}
          </Text>
          <View style={styles.placeRow}>
            <Ionicons
              name={isSpot ? 'location' : weather?.place.isFallback ? 'location-outline' : 'navigate'}
              size={14}
              color={colors.muted}
            />
            <Text style={styles.place} numberOfLines={1}>
              {placeLabel}
            </Text>
          </View>
        </View>
      </View>

      {uiState.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{onBack ? 'Récupération de la météo du spot…' : 'Récupération de la météo autour de vous…'}</Text>
        </View>
      )}

      {uiState.status === 'error' && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text accessibilityRole="alert" style={styles.message}>
            {uiState.message}
          </Text>
          <Pressable accessibilityRole="button" onPress={refresh} style={styles.retry}>
            <Text style={styles.retryText}>Réessayer</Text>
          </Pressable>
        </View>
      )}

      {uiState.status === 'success' && weather && (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={
            <RefreshControl refreshing={uiState.isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
          }
        >
          {weather.place.isFallback && (
            <Text style={styles.notice}>
              Localisation non autorisée : météo affichée pour le lieu par défaut. Autorisez la localisation dans les réglages pour voir votre ville.
            </Text>
          )}
          <CurrentWeatherCard current={weather.forecast.current} />
          {!isSpot && <FishingIndexCard index={weather.fishingIndex} />}
          <HourlyForecastStrip hours={weather.forecast.hourly} />
          {isSpot && <FishingIndexCard index={weather.fishingIndex} />}
          {/* À venir : « Activité des poissons heure par heure », calculée par un agent IA. */}

          <View style={styles.twoColumns}>
            {weather.forecast.daily[0] && (
              <Card style={styles.half}>
                <Text style={styles.smallLabel}>Lever / coucher</Text>
                <Text style={styles.smallValue}>
                  {formatClock(weather.forecast.daily[0].sunrise)} · {formatClock(weather.forecast.daily[0].sunset)}
                </Text>
              </Card>
            )}
            <Card style={styles.half}>
              <Text style={styles.smallLabel}>Lune</Text>
              <Text style={styles.smallValue}>{weather.moonPhase}</Text>
            </Card>
          </View>

          <DailyForecastList days={weather.forecast.daily} />
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
    justifyContent: 'center',
    paddingHorizontal: 20,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerWithBack: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-start', gap: spacing.sm, paddingHorizontal: spacing.md },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  placeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  place: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  message: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
  retry: {
    minHeight: 44,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
  },
  retryText: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  content: { padding: spacing.lg, gap: 14 },
  notice: {
    fontFamily: fonts.body,
    fontSize: 13,
    lineHeight: 18,
    color: colors.ink,
    backgroundColor: '#FBEBD3',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  twoColumns: { flexDirection: 'row', gap: 10 },
  half: { flex: 1, gap: 4, padding: 14 },
  smallLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  smallValue: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  credit: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, textAlign: 'center' },
});
