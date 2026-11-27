import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/core/theme/tokens';

import type { DailyForecast } from '../../domain/entities/Weather';
import { useI18n } from '@/core/i18n/useI18n';

import { conditionIcon, conditionKey, formatDay, formatTemperature } from '../weatherFormat';
import { Card } from './Card';

/** Liste des prochains jours : jour, temps, min / max. */
export function DailyForecastList({ days }: { days: DailyForecast[] }) {
  const { t, language } = useI18n();
  return (
    <Card style={styles.card}>
      <Text accessibilityRole="header" style={styles.title}>
        {t('weather.nextDays')}
      </Text>
      {days.map((day, i) => (
        <View key={day.localDate} style={[styles.row, i > 0 && styles.separator]}>
          <Text style={styles.day}>{formatDay(day.localDate, i, language) ?? t('common.today')}</Text>
          <Ionicons name={conditionIcon(day.condition)} size={20} color={colors.primary} />
          <Text style={styles.condition}>{t(conditionKey(day.condition))}</Text>
          <Text style={styles.min}>{formatTemperature(day.minTemperature)}</Text>
          <Text style={styles.max}>{formatTemperature(day.maxTemperature)}</Text>
        </View>
      ))}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: spacing.sm },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, marginVertical: spacing.sm },
  row: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  separator: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
  day: { width: 88, fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  condition: { flex: 1, fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  min: { fontFamily: fonts.body, fontSize: 14, color: colors.muted },
  max: { width: 34, textAlign: 'right', fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
});
