import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, radius } from '@/core/theme/tokens';

import type { FishActivity } from '../../../domain/entities/Spot';
import { ACTIVITY_OPTIONS } from '../../activityLabels';


interface Props {
  value: FishActivity | null;
  onChange: (value: FishActivity) => void;
}

/** « Activité des poissons » : un seul choix possible (comme des boutons radio). */
export function ActivitySelector({ value, onChange }: Props) {
  const { t } = useI18n();
  return (
    <View style={styles.card} accessibilityRole="radiogroup" accessibilityLabel={t('activity.title')}>
      <Text style={styles.title}>{t('activity.title')}</Text>
      <View style={styles.row}>
        {ACTIVITY_OPTIONS.map((option) => {
          const selected = option.value === value;
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected }}
              accessibilityLabel={t(option.label)}
              onPress={() => onChange(option.value)}
              style={[styles.option, selected && styles.optionSelected]}
            >
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={styles.label}>{t(option.label)}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: 16, gap: 12 },
  title: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  row: { flexDirection: 'row', gap: 8 },
  option: {
    flex: 1,
    minHeight: 84,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.ground,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionSelected: { backgroundColor: colors.primarySoft, borderColor: colors.primary },
  emoji: { fontSize: 32, lineHeight: 38 },
  label: { fontFamily: fonts.bodyBold, fontSize: 13, color: colors.ink, textAlign: 'center' },
});
