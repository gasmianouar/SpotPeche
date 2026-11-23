import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ShareTarget } from '@/core/external/ExternalApps';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import type { Coordinates } from '@/shared/domain/Coordinates';

/** Les 3 choix. Pastilles aux couleurs des apps, avec une icône neutre (pas leurs logos). */
const TARGETS: { target: ShareTarget; label: string; color: string; soft: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { target: 'whatsapp', label: 'WhatsApp', color: '#25D366', soft: '#EAF8EF', icon: 'chatbubble-ellipses-outline' },
  { target: 'messenger', label: 'Messenger', color: '#0084FF', soft: '#E6F2FF', icon: 'chatbubbles-outline' },
  { target: 'other', label: 'Autres', color: colors.muted, soft: colors.ground, icon: 'ellipsis-horizontal' },
];

interface Props {
  visible: boolean;
  ownerName: string;
  coordinates: Coordinates;
  link: string;
  notice: string | null;
  onShare: (target: ShareTarget) => void;
  onClose: () => void;
}

/** Feuille « Partager la localisation » (écran 5c de la maquette). */
export function ShareLocationSheet({ visible, ownerName, coordinates, link, notice, onShare, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer le partage" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.titles}>
            <Text accessibilityRole="header" style={styles.title}>
              Partager la localisation
            </Text>
            <Text style={styles.subtitle}>Vos amis reçoivent la position du spot et peuvent lancer le trajet.</Text>
          </View>

          <View style={styles.preview}>
            <View style={styles.pin}>
              <Ionicons name="location-outline" size={20} color={colors.primary} />
            </View>
            <View style={styles.previewTexts}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                📍 Spot de {ownerName}
              </Text>
              <Text style={styles.previewLine}>
                GPS {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
              </Text>
              <Text style={styles.previewLink} numberOfLines={1}>
                {link.replace('https://', '')}
              </Text>
            </View>
          </View>

          <View style={styles.targets}>
            {TARGETS.map((t) => (
              <Pressable
                key={t.target}
                accessibilityRole="button"
                accessibilityLabel={t.target === 'other' ? 'Partager avec une autre app' : `Partager la position du spot via ${t.label}`}
                onPress={() => onShare(t.target)}
                style={({ pressed }) => [styles.target, { backgroundColor: t.soft }, pressed && styles.pressed]}
              >
                <View style={[styles.targetIcon, { backgroundColor: t.color }]}>
                  <Ionicons name={t.icon} size={24} color={colors.surface} />
                </View>
                <Text style={styles.targetLabel}>{t.label}</Text>
              </Pressable>
            ))}
          </View>

          {notice && (
            <Text accessibilityRole="alert" style={styles.notice}>
              {notice}
            </Text>
          )}

          <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.cancel, pressed && styles.pressed]}>
            <Text style={styles.cancelLabel}>Annuler</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(16,40,44,0.45)' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    gap: 14,
  },
  handle: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border },
  titles: { gap: 2 },
  title: { fontFamily: fonts.displayBold, fontSize: 19, color: colors.ink },
  subtitle: { fontFamily: fonts.body, fontSize: 13, color: colors.muted },
  preview: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.ground },
  pin: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  previewTexts: { flex: 1, gap: 2 },
  previewTitle: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink },
  previewLine: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  previewLink: { fontFamily: fonts.body, fontSize: 11, color: colors.primary },
  targets: { flexDirection: 'row', gap: spacing.sm },
  target: { flex: 1, minHeight: 88, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', gap: 6 },
  targetIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  targetLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink },
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FDF1E1', color: '#8A4B06', fontFamily: fonts.bodySemiBold, fontSize: 13 },
  cancel: { height: 44, borderRadius: radius.md, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  pressed: { opacity: 0.85 },
});
