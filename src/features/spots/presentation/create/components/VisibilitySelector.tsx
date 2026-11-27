import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import type { TranslationKey } from '@/core/i18n/translations';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import type { SpotVisibility } from '../../../domain/entities/Spot';

interface Props {
  value: SpotVisibility;
  onChange: (value: SpotVisibility) => void;
}

const OPTIONS: readonly { value: SpotVisibility; label: TranslationKey; hint: TranslationKey }[] = [
  { value: 'private', label: 'visibility.private', hint: 'visibility.privateHint' },
  { value: 'public', label: 'visibility.public', hint: 'visibility.publicHint' },
];

/** « Qui peut voir ce spot ? » : moi uniquement ou toute la communauté (un seul choix). */
export function VisibilitySelector({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.card} accessibilityRole="radiogroup" accessibilityLabel={t('visibility.title')}>
      <Text style={styles.title}>{t('visibility.title')}</Text>
      {OPTIONS.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            accessibilityLabel={`${t(option.label)}. ${t(option.hint)}`}
            onPress={() => onChange(option.value)}
            style={[styles.option, selected && styles.optionSelected]}
          >
            <View style={[styles.dot, selected && styles.dotSelected]} />
            <View style={styles.texts}>
              <Text style={styles.label}>{t(option.label)}</Text>
              <Text style={styles.hint}>{t(option.hint)}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink, marginBottom: spacing.xs },
  option: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    backgroundColor: colors.ground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  dot: { width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: '#6A7D80', backgroundColor: colors.surface },
  dotSelected: { borderWidth: 6, borderColor: colors.primary },
  texts: { flex: 1, gap: 2 },
  label: { fontFamily: fonts.bodyBold, fontSize: 14, color: colors.ink, textAlign: 'left' },
  hint: { fontFamily: fonts.body, fontSize: 12, lineHeight: 16, color: colors.muted, textAlign: 'left' },
});
