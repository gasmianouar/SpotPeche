import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '@/core/theme/tokens';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

/**
 * Bouton réutilisable « Continuer avec … ».
 * Composant « bête » (présentationnel) : il reçoit tout par ses props
 * et ne sait rien de l'authentification.
 */
export function SocialSignInButton({ label, icon, backgroundColor, loading, disabled, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ busy: loading, disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor, opacity: disabled && !loading ? 0.5 : pressed ? 0.85 : 1 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.surface} />
      ) : (
        <>
          <Ionicons name={icon} size={22} color={colors.surface} />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  label: { color: colors.surface, fontFamily: fonts.bodySemiBold, fontSize: 17 },
});
