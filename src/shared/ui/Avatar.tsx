import { Image, StyleSheet, Text, View } from 'react-native';

import { fonts } from '@/core/theme/tokens';

interface Props {
  name: string;
  /** Photo de profil Facebook / Apple ; sans elle, on affiche les initiales. */
  photoUrl: string | null;
  size?: number;
}

/** Couleurs de fond des initiales (contraste suffisant avec le texte blanc). */
const PALETTE = ['#2F6DB5', '#B45A2A', '#137A42', '#7A4FB5', '#0E5A63', '#A8326E'];

export function initialsOf(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '?';
  return words
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

/** Toujours la même couleur pour un même nom. */
function colorOf(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

/** Avatar rond : la photo du profil, ou les initiales sur une couleur. */
export function Avatar({ name, photoUrl, size = 40 }: Props) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (photoUrl) {
    return <Image source={{ uri: photoUrl }} style={[styles.base, shape]} accessibilityIgnoresInvertColors />;
  }
  return (
    <View style={[styles.base, shape, { backgroundColor: colorOf(name) }]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>{initialsOf(name)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  initials: { fontFamily: fonts.bodyBold, color: '#FFFFFF' },
});
