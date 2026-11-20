import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { colors } from '@/core/theme/tokens';

/**
 * L'épingle dessinée sur la carte.
 * Vert + étoile = mon spot, rouge + rond = spot de la communauté.
 * La forme change aussi, pas seulement la couleur (accessibilité daltoniens).
 */
export function SpotMarker({ isMine }: { isMine: boolean }) {
  const color = isMine ? colors.mine : colors.community;
  return (
    <View style={styles.wrapper}>
      <View style={[styles.head, { backgroundColor: color }]}>
        {isMine ? <Ionicons name="star" size={14} color={colors.surface} /> : <View style={styles.dot} />}
      </View>
      <View style={[styles.tip, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  head: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.surface },
  // Petit triangle sous le rond, fait avec des bordures.
  tip: {
    width: 0,
    height: 0,
    marginTop: -2,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
});
