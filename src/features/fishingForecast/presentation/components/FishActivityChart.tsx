import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import type { TranslationKey } from '@/core/i18n/translations';
import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { FREE_DAILY_LIMITS } from '@/features/freeQuota/domain/FreeQuota';

import type { ActivityLevel, FishingForecast } from '../../domain/entities/FishingForecast';
import { clock } from '../../domain/services/localFishActivityModel';

const LEVELS: Record<ActivityLevel, { emoji: string; label: TranslationKey; color: string }> = {
  good: { emoji: '🤩', label: 'forecast.level.good', color: colors.mine },
  medium: { emoji: '😐', label: 'forecast.level.medium', color: colors.accent },
  none: { emoji: '😴', label: 'forecast.level.none', color: '#A9B7B9' },
};

const CONFIDENCE: Record<FishingForecast['confidence'], TranslationKey> = {
  low: 'forecast.confidence.low',
  medium: 'forecast.confidence.medium',
  high: 'forecast.confidence.high',
};
const BAR_MAX = 64;

interface Props {
  forecast: FishingForecast;
  isAnalyzing: boolean;
}

/** « Activité des poissons » heure par heure : emoji + barre, meilleur moment, et qui a calculé. */
export function FishActivityChart({ forecast, isAnalyzing }: Props) {
  const { t } = useI18n();
  const best = forecast.bestWindow;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          {t('forecast.activity.title')}
        </Text>
        <Text style={styles.caption}>{t('forecast.activity.hourly')}</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bars}>
        {forecast.hourly.map((hour) => {
          const look = LEVELS[hour.level];
          const inBest = !!best && hour.localTime >= best.start && hour.localTime < best.end;
          return (
            <View key={hour.localTime} style={styles.item} accessibilityLabel={t('forecast.activity.hourA11y', { hour: clock(hour.localTime), level: t(look.label) })}>
              <Text style={styles.emoji}>{look.emoji}</Text>
              <View style={styles.track}>
                <View style={[styles.bar, { height: Math.max(4, (hour.score / 100) * BAR_MAX), backgroundColor: look.color }]} />
              </View>
              <Text style={[styles.hour, inBest && styles.hourBest]}>{clock(hour.localTime)}</Text>
            </View>
          );
        })}
      </ScrollView>

      {best && (
        <Text style={styles.best}>
          <Text style={styles.bestStrong}>
            {t('forecast.bestWindow', { start: clock(best.start), end: clock(best.end) })}
          </Text>
        </Text>
      )}

      {forecast.freeLimitReached && !isAnalyzing && (
        <View accessibilityRole="alert" style={styles.limit}>
          <Ionicons name="hourglass-outline" size={16} color="#8A4B06" />
          <Text style={styles.limitText}>{t('forecast.freeLimit', { limit: FREE_DAILY_LIMITS['fish-activity'] })}</Text>
        </View>
      )}

      <View style={styles.source}>
        {isAnalyzing ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.sourceText}>{t('forecast.analyzing')}</Text>
          </>
        ) : forecast.source === 'ai' ? (
          <>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.sourceText}>
              {t('forecast.aiSource', { model: forecast.model ?? 'Claude', confidence: t(CONFIDENCE[forecast.confidence]) })}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="calculator-outline" size={14} color={colors.muted} />
            <Text style={styles.sourceText}>
              {forecast.fallbackReason && !forecast.freeLimitReached ? `${t('forecast.aiUnreachable')} ` : ''}
              {t('forecast.localSource')}
            </Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 14, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  caption: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  bars: { gap: 4, alignItems: 'flex-end' },
  item: { width: 36, alignItems: 'center', gap: 4 },
  emoji: { fontSize: 15, lineHeight: 18 },
  track: { height: BAR_MAX, justifyContent: 'flex-end' },
  bar: { width: 18, borderTopLeftRadius: 6, borderTopRightRadius: 6, borderBottomLeftRadius: 3, borderBottomRightRadius: 3 },
  hour: { fontFamily: fonts.bodySemiBold, fontSize: 11, color: colors.muted },
  hourBest: { color: colors.mine, fontFamily: fonts.bodyBold },
  best: { fontFamily: fonts.body, fontSize: 13, color: colors.ink },
  bestStrong: { fontFamily: fonts.bodyBold },
  limit: { flexDirection: 'row', alignItems: 'flex-start', gap: 6, padding: 10, borderRadius: radius.md, backgroundColor: '#FDF1E1' },
  limitText: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 12, lineHeight: 17, color: '#8A4B06' },
  source: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { flex: 1, fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
});
