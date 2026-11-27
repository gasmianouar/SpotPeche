import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TranslationKey } from '@/core/i18n/translations';
import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius, spacing, touchTarget } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

import { REPORT_REASONS, type ReportReason } from '../domain/entities/Report';
import { useReportViewModel } from './useReportViewModel';

const REASON_TEXTS: Record<ReportReason, { label: TranslationKey; hint: TranslationKey }> = {
  forbidden: { label: 'report.reason.forbidden', hint: 'report.reason.forbiddenHint' },
  inappropriate: { label: 'report.reason.inappropriate', hint: 'report.reason.inappropriateHint' },
  spam: { label: 'report.reason.spam', hint: 'report.reason.spamHint' },
  false: { label: 'report.reason.false', hint: 'report.reason.falseHint' },
  other: { label: 'report.reason.other', hint: 'report.reason.otherHint' },
};

/** VUE « Signaler ou bloquer » (écran 5d de la maquette). */
export function ReportScreen({ spotId, messageId }: { spotId: string; messageId?: string }) {
  const { t } = useI18n();
  const vm = useReportViewModel(spotId, messageId);

  const title =
    vm.step === 'report'
      ? vm.target.kind === 'message'
        ? t('report.messageOf', { name: vm.messageAuthor?.name ?? '' })
        : t('report.spot')
      : vm.step === 'block' && vm.blockTarget
        ? t('block.question', { name: vm.blockTarget.name })
        : t('report.optionsTitle');

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <IconButton icon="close" accessibilityLabel={t('common.close')} onPress={vm.close} />
        <Text accessibilityRole="header" style={styles.headerTitle} numberOfLines={1}>
          {title}
        </Text>
      </View>

      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {vm.step === 'loading' && <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />}

          {vm.step === 'unavailable' && (
            <Text style={styles.paragraph}>{t('detail.notFound')}</Text>
          )}

          {vm.step === 'menu' && (
            <View style={styles.list}>
              <OptionRow icon="flag-outline" label={t('report.spot')} hint={t('report.spotHint')} onPress={vm.startReportSpot} />
              {vm.owner && (
                <OptionRow
                  icon="ban-outline"
                  label={t('report.block', { name: vm.owner.name })}
                  danger
                  onPress={() => vm.owner && vm.startBlock(vm.owner)}
                />
              )}
              <Text style={styles.note}>{t('report.messageHint')}</Text>
            </View>
          )}

          {vm.step === 'report' && (
            <View style={styles.list}>
              <Text style={styles.note}>{t('report.anonymous')}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={t('report.reasonTitle')} style={styles.list}>
                {REPORT_REASONS.map((reason) => {
                  const selected = vm.reason === reason;
                  return (
                    <Pressable
                      key={reason}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: selected }}
                      onPress={() => vm.setReason(reason)}
                      style={[styles.reason, selected && styles.reasonSelected]}
                    >
                      <View style={[styles.dot, selected && styles.dotSelected]} />
                      <View style={styles.texts}>
                        <Text style={styles.label}>{t(REASON_TEXTS[reason].label)}</Text>
                        <Text style={styles.hint}>{t(REASON_TEXTS[reason].hint)}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={styles.fieldLabel} nativeID="report-details-label">
                {t(vm.detailsRequired ? 'report.detailsRequired' : 'report.details')}
              </Text>
              <TextInput
                accessibilityLabel={t(vm.detailsRequired ? 'report.detailsRequired' : 'report.details')}
                value={vm.details}
                onChangeText={vm.setDetails}
                maxLength={vm.detailsMaxLength}
                multiline
                style={styles.input}
              />
              {vm.error && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {vm.error}
                </Text>
              )}
              <View style={styles.buttons}>
                <SecondaryButton label={t('common.back')} onPress={vm.backToMenu} />
                <PrimaryButton label={t('report.send')} busy={vm.isBusy} onPress={vm.send} />
              </View>
            </View>
          )}

          {vm.step === 'block' && vm.blockTarget && (
            <View style={styles.list}>
              {(['block.point1', 'block.point2', 'block.point3'] as const).map((key) => (
                <View key={key} style={styles.bullet}>
                  <Ionicons name="ellipse" size={6} color={colors.ink} style={styles.bulletDot} />
                  <Text style={styles.paragraph}>{t(key)}</Text>
                </View>
              ))}
              {vm.error && (
                <Text accessibilityRole="alert" style={styles.error}>
                  {vm.error}
                </Text>
              )}
              <View style={styles.buttons}>
                <SecondaryButton label={t('common.back')} onPress={vm.backToMenu} />
                <PrimaryButton label={t('block.confirm')} busy={vm.isBusy} danger onPress={vm.confirmBlock} />
              </View>
            </View>
          )}

          {(vm.step === 'sent' || vm.step === 'blocked') && (
            <View accessibilityRole="summary" style={styles.done}>
              <View style={styles.check}>
                <Ionicons name="checkmark" size={30} color={colors.surface} />
              </View>
              <Text accessibilityRole="header" style={styles.doneTitle}>
                {vm.step === 'sent' ? t('report.sentTitle') : t('block.doneTitle', { name: vm.blockTarget?.name ?? '' })}
              </Text>
              <Text style={[styles.paragraph, styles.center]}>
                {vm.step === 'sent' ? t('report.sentText') : t('block.doneText')}
              </Text>
              <PrimaryButton label={t('common.close')} onPress={vm.close} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function OptionRow({
  icon,
  label,
  hint,
  danger,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  hint?: string;
  danger?: boolean;
  onPress: () => void;
}) {
  const color = danger ? colors.danger : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.option, danger && styles.optionDanger, pressed && styles.pressed]}
    >
      <Ionicons name={icon} size={22} color={color} />
      <View style={styles.texts}>
        <Text style={[styles.label, { color }]}>{label}</Text>
        {hint && <Text style={styles.hint}>{hint}</Text>}
      </View>
    </Pressable>
  );
}

function PrimaryButton({ label, busy, danger, onPress }: { label: string; busy?: boolean; danger?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ busy: !!busy, disabled: !!busy }}
      disabled={busy}
      onPress={onPress}
      style={({ pressed }) => [styles.button, { backgroundColor: danger ? colors.danger : colors.primary }, pressed && styles.pressed]}
    >
      {busy ? <ActivityIndicator color={colors.surface} /> : <Text style={styles.buttonLabel}>{label}</Text>}
    </Pressable>
  );
}

function SecondaryButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.button, styles.secondary, pressed && styles.pressed]}>
      <Text style={[styles.buttonLabel, styles.secondaryLabel]}>{label}</Text>
    </Pressable>
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
  content: { padding: spacing.lg, gap: spacing.md },
  loader: { marginTop: spacing.xxl },
  list: { gap: spacing.sm },
  option: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
  },
  optionDanger: { backgroundColor: colors.dangerSoft },
  texts: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, textAlign: 'left' },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: 'left' },
  note: { fontFamily: fonts.body, fontSize: 13, color: colors.muted, textAlign: 'left' },
  reason: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 2,
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reasonSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6A7D80', backgroundColor: colors.surface },
  dotSelected: { borderWidth: 6, borderColor: colors.primary },
  fieldLabel: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.ink, marginTop: spacing.sm, textAlign: 'left' },
  input: {
    minHeight: 72,
    borderRadius: radius.sm + 2,
    borderWidth: 1.5,
    borderColor: '#C9D5D4',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontFamily: fonts.body,
    fontSize: 15,
    color: colors.ink,
    textAlignVertical: 'top',
  },
  error: { fontFamily: fonts.bodyMedium, fontSize: 13, color: colors.danger },
  buttons: { flexDirection: 'row', gap: 10, marginTop: spacing.sm },
  button: { flex: 1, minHeight: 48, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.lg },
  buttonLabel: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.surface },
  secondary: { backgroundColor: colors.surface, borderWidth: 1.5, borderColor: colors.border },
  secondaryLabel: { color: colors.ink },
  pressed: { opacity: 0.85 },
  bullet: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  bulletDot: { marginTop: 9 },
  paragraph: { flex: 1, fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.ink, textAlign: 'left' },
  done: { alignItems: 'center', gap: spacing.md, paddingTop: spacing.xl, minHeight: touchTarget },
  check: { width: 56, height: 56, borderRadius: 28, backgroundColor: colors.mine, alignItems: 'center', justifyContent: 'center' },
  doneTitle: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink, textAlign: 'center' },
  center: { textAlign: 'center', flex: 0 },
});
