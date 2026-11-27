import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TranslationKey } from '@/core/i18n/translations';
import { useI18n } from '@/core/i18n/useI18n';
import { useLanguageChooser } from '@/core/i18n/useLanguageChooser';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { PROVIDER_NAMES, type AuthProvider } from '@/features/auth/domain/entities/User';
import { Avatar } from '@/shared/ui/Avatar';
import { IconButton } from '@/shared/ui/IconButton';

import { NOTIFICATION_KINDS, type NotificationKind } from '../domain/entities/AccountPreferences';
import { RadioRow, Section, settingsStyles } from './components';
import { useAccountViewModel } from './useAccountViewModel';

const NOTIFICATION_TEXTS: Record<NotificationKind, { label: TranslationKey; hint: TranslationKey }> = {
  replies: { label: 'account.notif.replies', hint: 'account.notif.repliesHint' },
  mySpotsActivity: { label: 'account.notif.mySpotsActivity', hint: 'account.notif.mySpotsActivityHint' },
  goodConditions: { label: 'account.notif.goodConditions', hint: 'account.notif.goodConditionsHint' },
  nearbySpots: { label: 'account.notif.nearbySpots', hint: 'account.notif.nearbySpotsHint' },
};

const PROVIDER_ICONS: Record<AuthProvider, keyof typeof Ionicons.glyphMap> = {
  facebook: 'logo-facebook',
  apple: 'logo-apple',
  google: 'logo-google',
};

/** VUE « Compte et confidentialité » (écran 6 de la maquette). */
export function AccountScreen() {
  const vm = useAccountViewModel();
  const { t, language, languages } = useI18n();
  const chooseLanguage = useLanguageChooser();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel={t('common.back')} onPress={vm.back} />
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {t('account.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {vm.notice && (
          <Text accessibilityRole="alert" style={styles.notice}>
            {vm.notice}
          </Text>
        )}

        <Section title={t('account.providers')}>
          <View style={styles.profile}>
            <Avatar name={vm.user?.displayName ?? '?'} photoUrl={vm.user?.photoUrl ?? null} size={48} />
            <View style={settingsStyles.texts}>
              <Text style={styles.name}>{vm.user?.displayName ?? t('menu.guest')}</Text>
              <Text style={settingsStyles.hint}>{t('account.profileHint')}</Text>
            </View>
          </View>
          {vm.providers.map((link) => (
            <View key={link.provider} style={settingsStyles.row}>
              <Ionicons name={PROVIDER_ICONS[link.provider]} size={22} color={colors.ink} />
              <Text style={[settingsStyles.label, styles.flex]}>{PROVIDER_NAMES[link.provider]}</Text>
              {link.linked ? (
                <Text style={styles.connected}>{t('account.connected')}</Text>
              ) : (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('account.linkLabel', { provider: PROVIDER_NAMES[link.provider] })}
                  accessibilityState={{ busy: vm.linking === link.provider, disabled: vm.linking !== null }}
                  disabled={vm.linking !== null}
                  onPress={() => vm.link(link.provider)}
                  style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
                >
                  {vm.linking === link.provider ? (
                    <ActivityIndicator color={colors.primary} />
                  ) : (
                    <Text style={styles.pillLabel}>{t('account.link')}</Text>
                  )}
                </Pressable>
              )}
            </View>
          ))}
        </Section>

        <Section title={t('account.notifications')}>
          {NOTIFICATION_KINDS.map((kind) => (
            <View key={kind} style={settingsStyles.row}>
              <View style={settingsStyles.texts}>
                <Text style={settingsStyles.label}>{t(NOTIFICATION_TEXTS[kind].label)}</Text>
                <Text style={settingsStyles.hint}>{t(NOTIFICATION_TEXTS[kind].hint)}</Text>
              </View>
              <Switch
                accessibilityLabel={t(NOTIFICATION_TEXTS[kind].label)}
                value={vm.preferences.notifications[kind]}
                onValueChange={(value) => vm.toggleNotification(kind, value)}
                trackColor={{ true: colors.primary, false: '#8FA5A7' }}
                thumbColor={colors.surface}
              />
            </View>
          ))}
        </Section>

        <Section title={t('account.privacy')}>
          <Text style={settingsStyles.label}>{t('account.defaultVisibility')}</Text>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('account.defaultVisibility')} style={styles.radios}>
            <RadioRow
              label={t('visibility.private')}
              hint={t('visibility.privateHint')}
              selected={vm.preferences.defaultSpotVisibility === 'private'}
              onPress={() => vm.setDefaultVisibility('private')}
            />
            <RadioRow
              label={t('visibility.public')}
              hint={t('visibility.publicHint')}
              selected={vm.preferences.defaultSpotVisibility === 'public'}
              onPress={() => vm.setDefaultVisibility('public')}
            />
          </View>

          <Text style={[settingsStyles.label, styles.subTitle]}>{t('account.blocked')}</Text>
          {vm.blocked.length === 0 && <Text style={settingsStyles.hint}>{t('account.noBlocked')}</Text>}
          {vm.blocked.map((entry) => (
            <View key={entry.blockedId} style={settingsStyles.row}>
              <Avatar name={entry.blockedName || t('common.fisher')} photoUrl={null} size={32} />
              <Text style={[settingsStyles.label, styles.flex]}>{entry.blockedName || t('common.fisher')}</Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('account.unblockLabel', { name: entry.blockedName || t('common.fisher') })}
                onPress={() => vm.unblock(entry.blockedId)}
                style={({ pressed }) => [styles.pill, pressed && styles.pressed]}
              >
                <Text style={styles.pillLabel}>{t('account.unblock')}</Text>
              </Pressable>
            </View>
          ))}
        </Section>

        <Section title={t('account.language')}>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('account.language')} style={styles.languages}>
            {languages.map((option) => {
              const active = option.code === language;
              return (
                <Pressable
                  key={option.code}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: active }}
                  accessibilityLanguage={option.code}
                  onPress={() => chooseLanguage(option.code)}
                  style={[styles.language, active && styles.languageActive]}
                >
                  <Text style={[styles.languageLabel, active && styles.languageLabelActive]} numberOfLines={1}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Pressable
          accessibilityRole="button"
          onPress={vm.openDelete}
          style={({ pressed }) => [styles.delete, pressed && styles.pressed]}
        >
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <Text style={styles.deleteLabel}>{t('account.delete')}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  flex: { flex: 1 },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  headerTitle: { flex: 1, fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink, textAlign: 'left' },
  content: { padding: spacing.lg, gap: 14, paddingBottom: spacing.xxl },
  notice: {
    fontFamily: fonts.bodyMedium,
    fontSize: 13,
    color: colors.danger,
    backgroundColor: colors.dangerSoft,
    borderRadius: radius.sm,
    overflow: 'hidden',
    padding: spacing.md,
  },
  profile: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingBottom: spacing.sm },
  name: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.ink, textAlign: 'left' },
  connected: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.mine },
  pill: {
    minHeight: 36,
    minWidth: 88,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.primary },
  pressed: { opacity: 0.8 },
  radios: { gap: spacing.sm },
  subTitle: { marginTop: spacing.md },
  languages: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: 24,
    backgroundColor: colors.ground,
    borderWidth: 1,
    borderColor: colors.border,
  },
  language: { flex: 1, minHeight: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  languageActive: { backgroundColor: colors.primary },
  languageLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink },
  languageLabelActive: { color: colors.surface },
  delete: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
  },
  deleteLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.danger },
});
