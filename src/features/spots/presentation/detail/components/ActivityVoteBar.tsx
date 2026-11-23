import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/core/theme/tokens';

import type { FishActivity } from '../../../domain/entities/Spot';
import type { ActivityCount } from '../../../domain/usecases/GetSpotDetail';
import { activityOption } from '../../activityLabels';

interface Props {
  votes: readonly ActivityCount[];
  myVote: FishActivity | null;
  onVote: (activity: FishActivity) => void;
}

/** « Ça mord ? » : trois petites pastilles emoji + nombre d'avis. Un seul avis par personne. */
export function ActivityVoteBar({ votes, myVote, onVote }: Props) {
  return (
    <View style={styles.row} accessibilityLabel="Activité des poissons : votre avis">
      <Text style={styles.label}>Ça mord ?</Text>
      {votes.map(({ activity, count }) => {
        const option = activityOption(activity);
        if (!option) return null;
        const selected = activity === myVote;
        return (
          <Pressable
            key={activity}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={`${option.label} : ${count} avis${selected ? ', votre avis' : ''}`}
            onPress={() => onVote(activity)}
            style={[styles.pill, selected && styles.pillSelected]}
          >
            <Text style={styles.emoji}>{option.emoji}</Text>
            <Text style={[styles.count, selected && styles.countSelected]}>{count}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: spacing.md - 2,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  label: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 12, color: colors.muted },
  pill: {
    minHeight: 36,
    minWidth: 56,
    paddingHorizontal: 10,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: colors.ground,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  pillSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  emoji: { fontSize: 16, lineHeight: 20 },
  count: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.muted },
  countSelected: { color: colors.primary },
});
