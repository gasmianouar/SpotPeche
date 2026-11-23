import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

/** Petite légende en bas à gauche de la carte. En mode « Mes spots », une seule ligne. */
export function MapLegend({ onlyMine }: { onlyMine: boolean }) {
  return (
    <View style={styles.card}>
      <LegendRow color={colors.mine} label="Mes spots" />
      {!onlyMine && <LegendRow color={colors.community} label="Communauté" />}
    </View>
  );
}

function LegendRow({ color, label }: { color: string; label: string }) {
  return (
    <View style={styles.row}>
      <View style={[styles.swatch, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: 14,
    gap: 6,
    shadowColor: colors.ink,
    shadowOpacity: 0.14,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  swatch: { width: 12, height: 12, borderRadius: 6 },
  label: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.ink },
});
