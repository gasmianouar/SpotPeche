import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

interface Props {
  onMenuPress: () => void;
  onCreatePress: () => void;
}

/** Barre du haut : menu à gauche, titre, bouton « + » (créer un spot) à droite. */
export function HomeToolbar({ onMenuPress, onCreatePress }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.bar}>
      <IconButton icon="menu" accessibilityLabel={t('home.menu')} onPress={onMenuPress} />
      <Text accessibilityRole="header" style={styles.title}>
        Spot
      </Text>
      <IconButton
        icon="add"
        accessibilityLabel={t('home.create')}
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
