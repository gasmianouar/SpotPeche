import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import type { CurrentWeather } from '@/features/weather/domain/entities/Weather';
import {
  conditionIcon,
  conditionLabel,
  formatTemperature,
  windDirectionLabel,
} from '@/features/weather/presentation/weatherFormat';

/** Conditions actuelles en bandeau compact (2 lignes au lieu d'une grande carte). */
export function CompactCurrentWeather({ current }: { current: CurrentWeather }) {
  return (
    <View style={styles.card} accessibilityLabel="Conditions actuelles">
      <View style={styles.top}>
        <Ionicons name={conditionIcon(current.condition)} size={36} color={colors.accent} />
        <Text style={styles.temperature}>{formatTemperature(current.temperature)}</Text>
        <View style={styles.texts}>
          <Text style={styles.condition} numberOfLines={1}>
            {conditionLabel(current.condition)}
          </Text>
          <Text style={styles.caption}>Maintenant · ressenti {formatTemperature(current.apparentTemperature)}</Text>
        </View>
      </View>
      <View style={styles.metrics}>
        <Metric label="Vent" value={`${Math.round(current.windSpeed)} km/h ${windDirectionLabel(current.windDirection)}`} />
        <Metric label="Pression" value={`${Math.round(current.pressure)} hPa`} />
        <Metric label="Humidité" value={`${Math.round(current.humidity)} %`} />
      </View>
    </View>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.night, borderRadius: radius.lg, paddingVertical: spacing.md, paddingHorizontal: 14, gap: 10 },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  temperature: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, color: colors.surface },
  texts: { flex: 1, gap: 1 },
  condition: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.surface },
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.nightText },
  metrics: { flexDirection: 'row', gap: 6 },
  metric: { flex: 1, backgroundColor: '#174F55', borderRadius: radius.sm, paddingVertical: 6, paddingHorizontal: spacing.sm },
  metricLabel: { fontFamily: fonts.body, fontSize: 11, color: colors.nightText },
  metricValue: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.surface },
});
