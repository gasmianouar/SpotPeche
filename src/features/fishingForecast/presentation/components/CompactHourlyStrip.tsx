import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import type { HourlyForecast } from '@/features/weather/domain/entities/Weather';
import { conditionIcon, formatHour, formatTemperature } from '@/features/weather/presentation/weatherFormat';

/** « Heure par heure » en version serrée. */
export function CompactHourlyStrip({ hours }: { hours: readonly HourlyForecast[] }) {
  return (
    <View style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        Heure par heure
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {hours.map((hour, i) => (
          <View key={hour.localTime} style={styles.item}>
            <Text style={styles.hour}>{i === 0 ? 'Maint.' : formatHour(hour.localTime)}</Text>
            <Ionicons name={conditionIcon(hour.condition)} size={20} color={colors.primary} />
            <Text style={styles.temperature}>{formatTemperature(hour.temperature)}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 10, gap: spacing.xs },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, paddingHorizontal: 14 },
  row: { paddingHorizontal: 10, gap: 2 },
  item: { width: 48, alignItems: 'center', gap: 2, paddingVertical: 2 },
  hour: { fontFamily: fonts.body, fontSize: 11, color: colors.muted },
  temperature: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
});
