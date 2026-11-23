import Ionicons from '@expo/vector-icons/Ionicons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { NavigationApp } from '@/core/external/ExternalApps';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

/** Les deux apps proposées. Pastille à leur couleur, avec une icône neutre (pas leurs logos). */
const APPS: { app: NavigationApp; label: string; hint: string; color: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { app: 'google-maps', label: 'Google Maps', hint: 'Trajet en voiture, à pied ou en transports', color: '#1A73E8', icon: 'map-outline' },
  { app: 'waze', label: 'Waze', hint: 'Trajet en voiture, trafic en temps réel', color: '#33CCFF', icon: 'car-outline' },
];

interface Props {
  visible: boolean;
  notice: string | null;
  onPick: (app: NavigationApp) => void;
  onClose: () => void;
}

/** Feuille « Itinéraire vers le spot » : ouvrir avec Google Maps ou Waze (écran 5b de la maquette). */
export function DirectionsSheet({ visible, notice, onPick, onClose }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.overlay}>
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={onClose} style={styles.backdrop} />
        <View accessibilityViewIsModal style={[styles.sheet, { paddingBottom: spacing.lg + insets.bottom }]}>
          <View style={styles.handle} />
          <View style={styles.titles}>
            <Text accessibilityRole="header" style={styles.title}>
              Itinéraire vers le spot
            </Text>
            <Text style={styles.subtitle}>Trajet complet depuis votre position actuelle. Ouvrir avec :</Text>
          </View>

          <View style={styles.list}>
            {APPS.map((a) => (
              <Pressable
                key={a.app}
                accessibilityRole="button"
                accessibilityLabel={`Ouvrir l’itinéraire avec ${a.label}`}
                onPress={() => onPick(a.app)}
                style={({ pressed }) => [styles.row, pressed && styles.pressed]}
              >
                <View style={[styles.icon, { backgroundColor: a.color }]}>
                  <Ionicons name={a.icon} size={24} color={colors.surface} />
                </View>
                <View style={styles.rowTexts}>
                  <Text style={styles.rowLabel}>{a.label}</Text>
                  <Text style={styles.rowHint}>{a.hint}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.muted} />
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
  list: { gap: spacing.sm },
  row: { minHeight: 64, borderRadius: radius.md, backgroundColor: colors.ground, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: 14 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  rowTexts: { flex: 1, gap: 2 },
  rowLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  rowHint: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  notice: { padding: spacing.md, borderRadius: radius.md, backgroundColor: '#FDF1E1', color: '#8A4B06', fontFamily: fonts.bodySemiBold, fontSize: 13 },
  cancel: { height: 44, borderRadius: radius.md, backgroundColor: colors.ground, alignItems: 'center', justifyContent: 'center' },
  cancelLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  pressed: { opacity: 0.85 },
});
