import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import type { CurrentWeather } from '../../domain/entities/Weather';
import { useI18n } from '@/core/i18n/useI18n';

import { conditionIcon, conditionKey, formatTemperature, windDirectionLabel } from '../weatherFormat';

/** Grande carte sombre : température actuelle, vent, pression, humidité. */
export function CurrentWeatherCard({ current }: { current: CurrentWeather }) {
  const { t, language } = useI18n();
  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={styles.main}>
          <Text style={styles.caption}>{t('weather.now')}</Text>
          <Text style={styles.temperature}>{formatTemperature(current.temperature)}</Text>
          <Text style={styles.condition}>{t(conditionKey(current.condition))}</Text>
          <Text style={styles.caption}>{t('weather.feelsLike', { temperature: formatTemperature(current.apparentTemperature) })}</Text>
        </View>
        <Ionicons name={conditionIcon(current.condition)} size={84} color={colors.accent} />
      </View>
      <View style={styles.metrics}>
        <Metric
          label={t('weather.wind')}
          value={`${Math.round(current.windSpeed)} km/h ${windDirectionLabel(current.windDirection, language)}`}
        />
        <Metric label={t('weather.pressure')} value={`${Math.round(current.pressure)} hPa`} />
        <Metric label={t('weather.humidity')} value={`${Math.round(current.humidity)} %`} />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.night, borderRadius: 20, padding: 20, gap: spacing.lg },
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  main: { gap: 4 },
  caption: { fontFamily: fonts.body, fontSize: 14, color: colors.nightText },
  temperature: { fontFamily: fonts.display, fontSize: 64, lineHeight: 68, color: colors.surface },
  condition: { fontFamily: fonts.bodyMedium, fontSize: 16, color: colors.surface },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, backgroundColor: '#174F55', borderRadius: radius.md - 2, padding: 10, gap: 2 },
  metricLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.nightText },
  metricValue: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.surface },
});
