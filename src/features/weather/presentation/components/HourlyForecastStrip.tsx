import Ionicons from '@expo/vector-icons/Ionicons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, spacing } from '@/core/theme/tokens';

import type { HourlyForecast } from '../../domain/entities/Weather';
import { conditionIcon, formatHour, formatTemperature } from '../weatherFormat';
import { Card } from './Card';

/** Bande horizontale défilante des prochaines heures. */
export function HourlyForecastStrip({ hours }: { hours: HourlyForecast[] }) {
  const { t } = useI18n();
  return (
    <Card style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('weather.hourly')}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {hours.map((hour, i) => (
          <View key={hour.localTime} style={styles.item}>
            <Text style={styles.hour}>{i === 0 ? t('weather.nowShort') : formatHour(hour.localTime)}</Text>
            <Ionicons name={conditionIcon(hour.condition)} size={24} color={colors.primary} />
            <Text style={styles.temperature}>{formatTemperature(hour.temperature)}</Text>
          </View>
        ))}
      </ScrollView>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.md, paddingHorizontal: 0 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, paddingHorizontal: spacing.lg },
  row: { paddingHorizontal: spacing.md, gap: spacing.xs },
  item: { width: 56, alignItems: 'center', gap: 6, paddingVertical: 6 },
  hour: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  temperature: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
});
