import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { Language, LanguageOption } from '@/core/i18n/languages';
import { colors, fonts } from '@/core/theme/tokens';

interface Props {
  label: string;
  languages: readonly LanguageOption[];
  selected: Language;
  onSelect: (language: Language) => void;
}

/** Choix de la langue : trois boutons sur une ligne (العربية · Français · English). Composant présentationnel. */
export function LanguagePicker({ label, languages, selected, onSelect }: Props) {
  return (
    <View style={styles.wrapper}>
      <View style={styles.caption}>
        <Ionicons name="globe-outline" size={14} color={colors.surface} />
        <Text style={styles.captionText}>{label}</Text>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.row}>
        {languages.map((language) => {
          const active = language.code === selected;
          return (
            <Pressable
              key={language.code}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              accessibilityLanguage={language.code}
              onPress={() => onSelect(language.code)}
              style={[styles.option, active && styles.optionActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]} numberOfLines={1}>
                {language.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 8, alignItems: 'center' },
  caption: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  captionText: { fontFamily: fonts.bodySemiBold, fontSize: 13, color: colors.surface },
  row: {
    flexDirection: 'row',
    alignSelf: 'stretch',
    padding: 4,
    borderRadius: 24,
    backgroundColor: 'rgba(8,26,29,0.55)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  option: { flex: 1, minHeight: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 },
  optionActive: { backgroundColor: colors.surface },
  optionText: { fontFamily: fonts.bodySemiBold, fontSize: 14, color: colors.surface },
  optionTextActive: { color: colors.night },
});
