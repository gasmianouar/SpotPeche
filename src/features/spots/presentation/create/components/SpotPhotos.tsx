import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, radius } from '@/core/theme/tokens';

interface Props {
  uris: readonly string[];
  onRemove: (uri: string) => void;
}

/**
 * Photos jointes au commentaire (comme les pièces jointes d'un message Messenger) :
 * une rangée de miniatures, chacune avec un ✕ pour la retirer.
 */
export function SpotPhotos({ uris, onRemove }: Props) {
  const { t } = useI18n();
  if (uris.length === 0) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {uris.map((uri, index) => (
        <View key={uri} style={styles.photo}>
          <Image source={{ uri }} style={StyleSheet.absoluteFill} accessibilityLabel={t('create.photo', { number: index + 1 })} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('create.removePhoto', { number: index + 1 })}
            hitSlop={8}
            onPress={() => onRemove(uri)}
            style={styles.remove}
          >
            <Ionicons name="close" size={14} color={colors.surface} />
          </Pressable>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: 8, paddingHorizontal: 12, paddingTop: 12 },
  photo: { width: 72, height: 72, borderRadius: radius.sm, overflow: 'hidden', backgroundColor: colors.border },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(16,40,44,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
