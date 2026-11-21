import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/core/theme/tokens';

import type { FishingIndex } from '../../domain/services/fishingIndex';
import { Card } from './Card';

/** Carte « Indice de pêche » : note sur 5 + raisons. */
export function FishingIndexCard({ index }: { index: FishingIndex }) {
  return (
    <Card style={styles.row}>
      <View style={styles.badge} accessibilityLabel={`Indice de pêche ${index.score} sur 5`}>
        <Text style={styles.score}>{index.score}/5</Text>
      </View>
      <View style={styles.texts}>
        <Text style={styles.title}>Indice de pêche : {index.label.toLowerCase()}</Text>
        <Text style={styles.reasons}>{index.reasons.join(' · ')}</Text>
        <Text style={styles.note}>Indicatif, basé sur la pression et le vent</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FBEBD3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  score: { fontFamily: fonts.displayBold, fontSize: 20, color: '#8A4B06' },
  texts: { flex: 1, gap: 2 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  reasons: { fontFamily: fonts.body, fontSize: 13, lineHeight: 18, color: colors.muted },
  note: { fontFamily: fonts.body, fontSize: 12, color: colors.muted, marginTop: spacing.xs },
});
