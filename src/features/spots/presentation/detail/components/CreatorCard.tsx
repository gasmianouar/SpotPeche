import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { Avatar } from '@/shared/ui/Avatar';

import type { FishActivity, Spot } from '../../../domain/entities/Spot';
import type { ActivityCount } from '../../../domain/usecases/GetSpotDetail';
import { formatDate } from '../format';
import { ActivityVoteBar } from './ActivityVoteBar';

interface Props {
  spot: Spot;
  votes: readonly ActivityCount[];
  myVote: FishActivity | null;
  onDirections: () => void;
  onShare: () => void;
  onVote: (activity: FishActivity) => void;
}

/** En haut de la fiche : qui a créé le spot (profil Facebook), quand, les actions et le vote « ça mord ? ». */
export function CreatorCard({ spot, votes, myVote, onDirections, onShare, onVote }: Props) {
  const { t, language } = useI18n();
  const name = spot.ownerName || t('common.fisher');
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Avatar name={name} photoUrl={spot.ownerPhotoUrl} size={44} />
        <View style={styles.who}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.date}>{t('detail.createdOn', { date: formatDate(spot.createdAt, language) })}</Text>
        </View>
      </View>
      <View style={styles.actions}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('detail.directionsA11y')}
          accessibilityHint={t('detail.directionsHint')}
          onPress={onDirections}
          style={({ pressed }) => [styles.primary, pressed && styles.pressed]}
        >
          <Ionicons name="navigate" size={18} color={colors.surface} />
          <Text style={styles.primaryLabel}>{t('detail.directions')}</Text>
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel={t('detail.shareA11y')} onPress={onShare} style={({ pressed }) => [styles.secondary, pressed && styles.pressed]}>
          <Ionicons name="share-social-outline" size={18} color={colors.primary} />
          <Text style={styles.secondaryLabel}>{t('detail.share')}</Text>
        </Pressable>
      </View>
      <ActivityVoteBar votes={votes} myVote={myVote} onVote={onVote} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  who: { flex: 1, gap: 2 },
  name: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  date: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  actions: { flexDirection: 'row', gap: 10 },
  primary: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  primaryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  secondary: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  secondaryLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.primary },
  pressed: { opacity: 0.8 },
});
