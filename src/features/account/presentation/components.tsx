import Ionicons from '@expo/vector-icons/Ionicons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

/** Carte blanche avec un titre de section (réglages). */
export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View style={styles.section}>
      <Text accessibilityRole="header" style={styles.sectionTitle}>
        {title}
      </Text>
      {children}
    </View>
  );
}

/** Choix exclusif (bouton radio) avec un libellé et une ligne d'aide. */
export function RadioRow({ label, hint, selected, onPress }: { label: string; hint?: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      accessibilityLabel={hint ? `${label}. ${hint}` : label}
      onPress={onPress}
      style={[styles.radio, selected && styles.radioSelected]}
    >
      <View style={[styles.dot, selected && styles.dotSelected]} />
      <View style={styles.texts}>
        <Text style={styles.label}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </Pressable>
  );
}

/** Puce de liste. */
export function Bullet({ children }: { children: string }) {
  return (
    <View style={styles.bullet}>
      <Ionicons name="ellipse" size={6} color={colors.ink} style={styles.bulletDot} />
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

export const settingsStyles = StyleSheet.create({
  row: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
    paddingVertical: spacing.sm,
  },
  texts: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink, textAlign: 'left' },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: 'left' },
});

const styles = StyleSheet.create({
  section: { backgroundColor: colors.surface, borderRadius: radius.lg, paddingHorizontal: spacing.lg, paddingVertical: spacing.md, gap: spacing.sm },
  sectionTitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, textAlign: 'left' },
  radio: {
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.ground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  radioSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6A7D80', backgroundColor: colors.surface },
  dotSelected: { borderWidth: 6, borderColor: colors.primary },
  texts: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, textAlign: 'left' },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: 'left' },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bulletDot: { marginTop: 8 },
  bulletText: { flex: 1, fontFamily: fonts.body, fontSize: 14, lineHeight: 21, color: colors.ink, textAlign: 'left' },
});
