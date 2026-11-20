import { StyleSheet, Text, View } from 'react-native';

import { colors, fonts, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

interface Props {
  onMenuPress: () => void;
  onCreatePress: () => void;
}

/** Barre du haut : menu à gauche, titre, bouton « + » (créer un spot) à droite. */
export function HomeToolbar({ onMenuPress, onCreatePress }: Props) {
  return (
    <View style={styles.bar}>
      <IconButton icon="menu" accessibilityLabel="Ouvrir le menu" onPress={onMenuPress} />
      <Text accessibilityRole="header" style={styles.title}>
        Spot
      </Text>
      <IconButton
        icon="add"
        accessibilityLabel="Créer un spot"
        onPress={onCreatePress}
        style={styles.addButton}
        size={26}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  title: { fontFamily: fonts.displayBold, fontSize: 22, color: colors.ink },
  addButton: { backgroundColor: colors.accent },
});
