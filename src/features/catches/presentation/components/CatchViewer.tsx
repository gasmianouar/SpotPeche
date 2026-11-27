import Ionicons from '@expo/vector-icons/Ionicons';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import type { Catch } from '../../domain/entities/Catch';
import { formatCatchLongDate } from '../catchFormat';

interface Props {
  item: Catch | null;
  onClose: () => void;
  onOpenSpot: (item: Catch) => void;
}

/** La photo d'une prise en grand, avec son lieu, sa date et un lien vers le spot. */
export function CatchViewer({ item, onClose, onOpenSpot }: Props) {
  const insets = useSafeAreaInsets();
  const { t, language } = useI18n();
  return (
    <Modal visible={item !== null} animationType="fade" onRequestClose={onClose} statusBarTranslucent>
      {item && (
        <View style={[styles.screen, { paddingTop: insets.top }]}>
          <View style={styles.top}>
            <Pressable accessibilityRole="button" accessibilityLabel={t('catches.viewer.close')} onPress={onClose} style={styles.close}>
              <Ionicons name="close" size={22} color={colors.surface} />
            </Pressable>
          </View>
          <Image
            source={{ uri: item.photoUri }}
            resizeMode="contain"
            style={styles.photo}
            accessibilityLabel={t('catches.viewer.photo', { place: item.placeName })}
          />
          <View style={[styles.panel, { paddingBottom: spacing.lg + insets.bottom }]}>
            <View style={styles.line}>
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <Text style={styles.place}>{item.placeName}</Text>
            </View>
            <View style={styles.line}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={styles.text}>{formatCatchLongDate(item.takenAt, language)}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onOpenSpot(item)}
              style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
              <Text style={styles.buttonLabel}>{t('catches.viewer.openSpot')}</Text>
            </Pressable>
          </View>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#081A1D' },
  top: { height: 56, justifyContent: 'center', paddingHorizontal: spacing.md },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: { flex: 1, width: '100%' },
  panel: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    gap: 10,
  },
  line: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  place: { flex: 1, fontFamily: fonts.displayBold, fontSize: 18, color: colors.ink },
  text: { fontFamily: fonts.body, fontSize: 14, color: colors.ink },
  button: {
    height: 48,
    marginTop: spacing.xs,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  pressed: { opacity: 0.85 },
});
