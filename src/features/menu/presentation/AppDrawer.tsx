import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect, useRef, useState } from 'react';
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { PROVIDER_NAMES } from '@/features/auth/domain/entities/User';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import { MENU_ITEMS, type MenuItem } from './menuItems';
import { useDrawerViewModel } from './useDrawerViewModel';

const DRAWER_WIDTH = 304;
const ANIMATION_MS = 220;

/**
 * MENU LATÉRAL (écran 2b de la maquette).
 *
 * Construit avec <Modal> et l'API Animated de React Native : aucune librairie
 * native en plus, donc pas besoin de recompiler l'app de développement.
 */
export function AppDrawer() {
  const { isOpen, close, user, isActive, select, confirmSignOut, openCredits } = useDrawerViewModel();
  const { t } = useI18n();
  const insets = useSafeAreaInsets();

  // Valeur animée : 0 = menu caché à gauche, 1 = menu ouvert.
  const progress = useRef(new Animated.Value(0)).current;
  // On garde la Modal montée pendant l'animation de fermeture.
  const [visible, setVisible] = useState(isOpen);

  useEffect(() => {
    if (isOpen) setVisible(true);
    Animated.timing(progress, {
      toValue: isOpen ? 1 : 0,
      duration: ANIMATION_MS,
      useNativeDriver: true, // animation calculée côté natif : fluide
    }).start(({ finished }) => {
      if (finished && !isOpen) setVisible(false);
    });
  }, [isOpen, progress]);

  const translateX = progress.interpolate({ inputRange: [0, 1], outputRange: [-DRAWER_WIDTH, 0] });

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={close} statusBarTranslucent>
      {/* Fond assombri : le toucher ferme le menu. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.scrim, { opacity: progress }]}>
        <Pressable style={StyleSheet.absoluteFill} accessibilityRole="button" accessibilityLabel={t('menu.close')} onPress={close} />
      </Animated.View>

      <Animated.View accessibilityViewIsModal style={[styles.drawer, { transform: [{ translateX }] }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing.xl }]}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initials(user?.displayName)}</Text>
          </View>
          <Text style={styles.name}>{user?.displayName ?? t('menu.guest')}</Text>
          <Text style={styles.provider}>
            {user ? t('menu.connectedWith', { provider: PROVIDER_NAMES[user.provider] }) : ''}
          </Text>
        </View>

        {/* flex: 1 : la liste prend la place libre, le bouton de déconnexion reste en bas. */}
        <ScrollView style={styles.listContainer} contentContainerStyle={styles.list}>
          {MENU_ITEMS.map((item) => (
            <DrawerRow key={item.id} item={item} active={isActive(item)} onPress={() => select(item)} />
          ))}
        </ScrollView>
        <View style={styles.divider} />

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('menu.signOut')}
          onPress={confirmSignOut}
          style={({ pressed }) => [styles.row, styles.signOut, pressed && styles.pressed]}
        >
          <Ionicons name="log-out-outline" size={22} color="#B42318" />
          <Text style={[styles.rowLabel, styles.signOutLabel]}>{t('menu.signOut')}</Text>
        </Pressable>

        {/* Mention des licences, discrète : obligation des licences MIT et Apache 2.0 des modèles embarqués. */}
        <Pressable
          accessibilityRole="link"
          onPress={openCredits}
          hitSlop={8}
          style={({ pressed }) => [styles.credits, { marginBottom: insets.bottom + spacing.md }, pressed && styles.pressed]}
        >
          <Text style={styles.creditsLabel}>{t('menu.credits')}</Text>
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

function DrawerRow({ item, active, onPress }: { item: MenuItem; active: boolean; onPress: () => void }) {
  const { t } = useI18n();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, active && styles.rowActive, pressed && styles.pressed]}
    >
      <Ionicons name={item.icon} size={22} color={active ? colors.primary : (item.iconColor ?? colors.ink)} />
      <View style={styles.rowTexts}>
        <Text style={[styles.rowLabel, active && styles.rowLabelActive]}>{t(item.label)}</Text>
        {item.subtitle && <Text style={styles.rowSubtitle}>{t(item.subtitle)}</Text>}
      </View>
      {item.destination.kind === 'nearbyBaitShops' && <Ionicons name="open-outline" size={18} color={colors.muted} />}
    </Pressable>
  );
}

/** "Pêcheur démo" → "PD" */
function initials(name?: string): string {
  if (!name) return '?';
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

const styles = StyleSheet.create({
  scrim: { backgroundColor: 'rgba(8,26,29,0.55)' },
  drawer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_WIDTH,
    backgroundColor: colors.surface,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    overflow: 'hidden',
  },
  header: { backgroundColor: colors.night, paddingHorizontal: 20, paddingBottom: 20, gap: 6 },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  avatarText: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.night },
  name: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.surface },
  provider: { fontFamily: fonts.body, fontSize: 14, color: colors.nightText },
  listContainer: { flex: 1 },
  list: { padding: spacing.md, gap: 2 },
  row: {
    minHeight: 48,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md - 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rowActive: { backgroundColor: colors.primarySoft },
  pressed: { opacity: 0.7 },
  rowTexts: { flex: 1, gap: 2, paddingVertical: 6 },
  rowLabel: { fontFamily: fonts.bodyMedium, fontSize: 15, color: colors.ink },
  rowSubtitle: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
  rowLabelActive: { fontFamily: fonts.bodyBold, color: colors.primary },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm, marginHorizontal: spacing.md },
  signOut: { marginHorizontal: spacing.md, marginTop: spacing.sm },
  signOutLabel: { fontFamily: fonts.bodySemiBold, color: '#B42318' },
  credits: { alignSelf: 'flex-start', marginHorizontal: spacing.xl, marginTop: spacing.xs },
  creditsLabel: { fontFamily: fonts.body, fontSize: 12, color: colors.muted },
});
