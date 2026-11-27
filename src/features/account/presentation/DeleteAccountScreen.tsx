import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { Bullet, RadioRow, Section } from './components';
import { useDeleteAccountViewModel } from './useDeleteAccountViewModel';

/** VUE « Supprimer mon compte » (écran 6a de la maquette). */
export function DeleteAccountScreen() {
  const vm = useDeleteAccountViewModel();
  const { t } = useI18n();
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={styles.headerTitle}>
          {t('delete.title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <Section title={t('delete.whatTitle')}>
          <Bullet>{t('delete.what1')}</Bullet>
          <Bullet>{t('delete.what2')}</Bullet>
          <Bullet>{t('delete.what3')}</Bullet>
          <Bullet>{t('delete.what4')}</Bullet>
        </Section>

        <Section title={t('delete.publicTitle')}>
          <View accessibilityRole="radiogroup" accessibilityLabel={t('delete.publicTitle')} style={styles.radios}>
            <RadioRow
              label={t('delete.public.delete')}
              hint={t('delete.public.deleteHint')}
              selected={vm.publicContent === 'delete'}
              onPress={() => vm.setPublicContent('delete')}
            />
            <RadioRow
              label={t('delete.public.anonymize')}
              hint={t('delete.public.anonymizeHint')}
              selected={vm.publicContent === 'anonymize'}
              onPress={() => vm.setPublicContent('anonymize')}
            />
          </View>
        </Section>

        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: vm.confirmed }}
          onPress={vm.toggleConfirmed}
          style={styles.checkRow}
        >
          <View style={[styles.box, vm.confirmed && styles.boxChecked]}>
            {vm.confirmed && <Ionicons name="checkmark" size={18} color={colors.surface} />}
          </View>
          <Text style={styles.checkLabel}>{t('delete.confirm')}</Text>
        </Pressable>

        {vm.error && (
          <Text accessibilityRole="alert" style={styles.error}>
            {vm.error}
          </Text>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !vm.confirmed || vm.isDeleting, busy: vm.isDeleting }}
          disabled={vm.isDeleting}
          onPress={vm.remove}
          style={({ pressed }) => [styles.button, !vm.confirmed && styles.buttonDisabled, pressed && styles.pressed]}
        >
          {vm.isDeleting ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <Text style={[styles.buttonLabel, !vm.confirmed && styles.buttonLabelDisabled]}>{t('delete.button')}</Text>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
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
  content: { padding: spacing.lg, gap: 14 },
  radios: { gap: spacing.sm },
  checkRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.xs },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#6A7D80',
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxChecked: { backgroundColor: colors.danger, borderColor: colors.danger },
  checkLabel: { flex: 1, fontFamily: fonts.bodySemiBold, fontSize: 14, lineHeight: 20, color: colors.ink, textAlign: 'left' },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger },
  footer: {
    padding: spacing.lg,
    paddingTop: spacing.md,
    backgroundColor: colors.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
  button: { height: 52, borderRadius: radius.md, backgroundColor: colors.danger, alignItems: 'center', justifyContent: 'center' },
  buttonDisabled: { backgroundColor: colors.border },
  buttonLabel: { fontFamily: fonts.bodyBold, fontSize: 16, color: colors.surface },
  buttonLabelDisabled: { color: colors.muted },
  pressed: { opacity: 0.85 },
});
