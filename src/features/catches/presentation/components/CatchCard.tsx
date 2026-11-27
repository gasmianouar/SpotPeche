import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import type { Catch } from '../../domain/entities/Catch';
import { formatCatchShortDate } from '../catchFormat';

/** Une prise dans la grille : la photo avec sa date, puis le lieu. */
export function CatchCard({ item, onPress }: { item: Catch; onPress: () => void }) {
  const { t, language } = useI18n();
  const [broken, setBroken] = useState(false);
  const date = formatCatchShortDate(item.takenAt, language);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t('catches.card.a11y', { date, place: item.placeName })}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.photoBox}>
        {broken ? (
          // Photo supprimée du téléphone : on garde la prise, avec un pictogramme.
          <Ionicons name="image-outline" size={36} color={colors.muted} />
        ) : (
          <Image source={{ uri: item.photoUri }} style={styles.photo} onError={() => setBroken(true)} />
        )}
        <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.place}>
        <Ionicons name="location-outline" size={13} color={colors.muted} />
        <Text style={styles.placeName} numberOfLines={1}>
          {item.placeName}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, overflow: 'hidden', paddingBottom: 10, gap: 8 },
  pressed: { opacity: 0.85 },
  photoBox: { height: 128, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  photo: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
  date: {
    position: 'absolute',
    left: spacing.sm,
    bottom: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: 'rgba(8,26,29,0.72)',
    color: colors.surface,
    fontFamily: fonts.bodyBold,
    fontSize: 11,
  },
  place: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10 },
  placeName: { flex: 1, fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
});
