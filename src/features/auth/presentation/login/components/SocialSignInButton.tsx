import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { colors, fonts, radius } from '@/core/theme/tokens';

interface Props {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  backgroundColor: string;
  /** Couleur du texte et de l'icône (blanc par défaut). */
  foregroundColor?: string;
  /** Bordure, pour un bouton clair sur fond photo (Google). */
  borderColor?: string;
  loading: boolean;
  disabled: boolean;
  onPress: () => void;
}

/**
 * Bouton réutilisable « Continuer avec … ».
 * Composant « bête » (présentationnel) : il reçoit tout par ses props
 * et ne sait rien de l'authentification.
 */
export function SocialSignInButton({
  label,
  icon,
  backgroundColor,
  foregroundColor = colors.surface,
  borderColor,
  loading,
  disabled,
  onPress,
}: Props) {
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
        borderColor ? { borderWidth: 1, borderColor } : null,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={foregroundColor} />
      ) : (
        <>
          <Ionicons name={icon} size={22} color={foregroundColor} />
          <Text style={[styles.label, { color: foregroundColor }]}>{label}</Text>
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
