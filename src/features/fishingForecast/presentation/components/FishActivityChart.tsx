import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import type { ActivityLevel, FishingForecast } from '../../domain/entities/FishingForecast';
import { clock } from '../../domain/services/localFishActivityModel';

const LEVELS: Record<ActivityLevel, { emoji: string; label: string; color: string }> = {
  good: { emoji: '🤩', label: 'ça mord bien', color: colors.mine },
  medium: { emoji: '😐', label: 'moyen', color: colors.accent },
  none: { emoji: '😴', label: 'faible', color: '#A9B7B9' },
};

const CONFIDENCE = { low: 'confiance faible', medium: 'confiance moyenne', high: 'confiance élevée' } as const;
const BAR_MAX = 64;

interface Props {
  forecast: FishingForecast;
  isAnalyzing: boolean;
}

/** « Activité des poissons » heure par heure : emoji + barre, meilleur moment, et qui a calculé. */
export function FishActivityChart({ forecast, isAnalyzing }: Props) {
  const best = forecast.bestWindow;
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          Activité des poissons
        </Text>
        <Text style={styles.caption}>heure par heure</Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bars}>
        {forecast.hourly.map((hour) => {
          const look = LEVELS[hour.level];
          const inBest = !!best && hour.localTime >= best.start && hour.localTime < best.end;
          return (
            <View key={hour.localTime} style={styles.item} accessibilityLabel={`${clock(hour.localTime)} : activité ${look.label}`}>
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
            Meilleur moment : {clock(best.start)} – {clock(best.end)}
          </Text>
        </Text>
      )}

      <View style={styles.source}>
        {isAnalyzing ? (
          <>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.sourceText}>Analyse par l’agent IA en cours… (estimation locale en attendant)</Text>
          </>
        ) : forecast.source === 'ai' ? (
          <>
            <Ionicons name="sparkles" size={14} color={colors.accent} />
            <Text style={styles.sourceText}>
              Analyse IA · {forecast.model ?? 'Claude'} · {CONFIDENCE[forecast.confidence]}
            </Text>
          </>
        ) : (
          <>
            <Ionicons name="calculator-outline" size={14} color={colors.muted} />
            <Text style={styles.sourceText}>
              {forecast.fallbackReason ?? 'Estimation locale.'} Calculée selon la lumière, la pression, le vent et la lune.
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
  source: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sourceText: { flex: 1, fontFamily: fonts.body, fontSize: 11, lineHeight: 15, color: colors.muted },
});
