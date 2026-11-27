import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { TranslationKey } from '@/core/i18n/translations';
import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { indexLabelKey, translateReason } from '@/features/weather/presentation/weatherFormat';

import { clock } from '../../domain/services/localFishActivityModel';
import type { FishingForecast } from '../../domain/entities/FishingForecast';
import type { ReliabilityValue } from '../../domain/entities/ReliabilityRating';
import type { ReliabilityCount } from '../../domain/usecases/GetSpotFishingConditions';

const RATINGS: Record<ReliabilityValue, { emoji: string; label: TranslationKey }> = {
  reliable: { emoji: '👍', label: 'forecast.reliability.reliable' },
  'so-so': { emoji: '😐', label: 'forecast.reliability.soSo' },
  wrong: { emoji: '👎', label: 'forecast.reliability.wrong' },
};

interface Props {
  forecast: FishingForecast;
  reliability: readonly ReliabilityCount[];
  myRating: ReliabilityValue | null;
  onRate: (value: ReliabilityValue) => void;
}

/** Indice de pêche compact + « Indice fiable ? » (chacun donne son avis, un seul par personne). */
export function FishingIndexPanel({ forecast, reliability, myRating, onRate }: Props) {
  const { t } = useI18n();
  const { index, bestWindow } = forecast;
  // Estimation locale : la phrase est recomposée dans la langue de l'app.
  // Analyse IA : son texte est gardé tel quel (l'agent répond en français).
  const summary =
    forecast.source === 'local'
      ? bestWindow
        ? `${t('forecast.bestWindow', { start: clock(bestWindow.start), end: clock(bestWindow.end) })}.`
        : t('forecast.noWindow')
      : index.summary;
  const details = [summary, ...index.reasons.map((r) => translateReason(r, t))].filter(Boolean).join(' · ');
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <View style={styles.badge} accessibilityLabel={t('weather.index.a11y', { score: index.score })}>
          <Text style={styles.score}>{index.score}/5</Text>
        </View>
        <View style={styles.texts}>
          <Text style={styles.title}>{t('weather.index.title', { label: t(indexLabelKey(index.label)) })}</Text>
          {details.length > 0 && (
            <Text style={styles.details} numberOfLines={3}>
              {details}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.rating} accessibilityLabel={t('forecast.reliability.a11y')}>
        <Text style={styles.ratingLabel}>{t('forecast.reliability.question')}</Text>
        {reliability.map(({ value, count }) => {
          const selected = value === myRating;
          return (
            <Pressable
              key={value}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`${t('common.opinions', { label: t(RATINGS[value].label), count })}${selected ? `, ${t('common.yourOpinion')}` : ''}`}
              onPress={() => onRate(value)}
              style={[styles.pill, selected && styles.pillSelected]}
            >
              <Text style={styles.emoji}>{RATINGS[value].emoji}</Text>
              <Text style={[styles.count, selected && styles.countSelected]}>{count}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingVertical: 10, paddingHorizontal: 14, gap: spacing.sm },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  badge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#FBEBD3', alignItems: 'center', justifyContent: 'center' },
  score: { fontFamily: fonts.displayBold, fontSize: 15, color: '#8A4B06' },
  texts: { flex: 1, gap: 1 },
  title: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  details: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  ratingLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.muted },
  pill: {
    minHeight: 34,
    minWidth: 50,
    paddingHorizontal: spacing.sm,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pillSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  emoji: { fontSize: 15, lineHeight: 18 },
  count: { fontFamily: fonts.bodyBold, fontSize: 12, color: colors.muted },
  countSelected: { color: colors.primary },
});
