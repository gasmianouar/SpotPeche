import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

/** Pastille « Mes spots ✕ » en haut de la carte : un toucher réaffiche tous les spots. */
export function FilterChip({ label, onClear }: { label: string; onClear: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}. Toucher pour afficher tous les spots`}
      onPress={onClear}
      style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
    >
      <Ionicons name="star" size={14} color={colors.surface} />
      <Text style={styles.label}>{label}</Text>
      <Ionicons name="close" size={16} color={colors.surface} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.pill,
    backgroundColor: colors.mine,
    shadowColor: colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  pressed: { opacity: 0.85 },
  label: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.surface },
});
