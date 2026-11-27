import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import { CURRENT_POSITION_NAME } from '../domain/usecases/GetLocalWeather';

import { Card } from './components/Card';
import { CurrentWeatherCard } from './components/CurrentWeatherCard';
import { DailyForecastList } from './components/DailyForecastList';
import { FishingIndexCard } from './components/FishingIndexCard';
import { HourlyForecastStrip } from './components/HourlyForecastStrip';
import { useWeatherViewModel } from './useWeatherViewModel';
import { formatClock, moonPhaseKey } from './weatherFormat';

/** VUE de l'écran Météo (écran 4 de la maquette). */
export function WeatherScreen() {
  const { uiState, refresh } = useWeatherViewModel();
  const { t } = useI18n();
  const weather = uiState.status === 'success' ? uiState.weather : null;

  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('weather.title')}
        </Text>
        <View style={styles.placeRow}>
          <Ionicons name={weather?.place.isFallback ? 'location-outline' : 'navigate'} size={14} color={colors.muted} />
          <Text style={styles.place}>{weather ? (weather.place.name === CURRENT_POSITION_NAME ? t('weather.currentPosition') : weather.place.name) : t('weather.locating')}</Text>
        </View>
      </View>

      {uiState.status === 'loading' && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.message}>{t('weather.loading')}</Text>
        </View>
      )}

      {uiState.status === 'error' && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={colors.muted} />
          <Text accessibilityRole="alert" style={styles.message}>
            {t('weather.error')}
          </Text>
          <Pressable accessibilityRole="button" onPress={refresh} style={styles.retry}>
            <Text style={styles.retryText}>{t('common.retry')}</Text>
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
              {t('weather.fallbackNotice')}
            </Text>
          )}
          <CurrentWeatherCard current={weather.forecast.current} />
          <FishingIndexCard index={weather.fishingIndex} />
          <HourlyForecastStrip hours={weather.forecast.hourly} />

          <View style={styles.twoColumns}>
            {weather.forecast.daily[0] && (
              <Card style={styles.half}>
                <Text style={styles.smallLabel}>{t('weather.sunriseSunset')}</Text>
                <Text style={styles.smallValue}>
                  {formatClock(weather.forecast.daily[0].sunrise)} · {formatClock(weather.forecast.daily[0].sunset)}
                </Text>
              </Card>
            )}
            <Card style={styles.half}>
              <Text style={styles.smallLabel}>{t('weather.moon')}</Text>
              <Text style={styles.smallValue}>{t(moonPhaseKey(weather.moonPhase))}</Text>
            </Card>
          </View>

          <DailyForecastList days={weather.forecast.daily} />
          <Text style={styles.credit}>{t('weather.credit')}</Text>
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
