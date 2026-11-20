import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { colors, touchTarget } from '@/core/theme/tokens';

interface Props {
  icon: keyof typeof Ionicons.glyphMap;
  /** Lu par VoiceOver / TalkBack : obligatoire pour un bouton sans texte. */
  accessibilityLabel: string;
  onPress: () => void;
  color?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

/** Bouton icône réutilisable (menu, « + », me localiser…). */
export function IconButton({ icon, accessibilityLabel, onPress, color = colors.ink, size = 24, style }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={8}
      onPress={onPress}
      style={({ pressed }) => [styles.base, style, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: touchTarget / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { opacity: 0.7 },
});
