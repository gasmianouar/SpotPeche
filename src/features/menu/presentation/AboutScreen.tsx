import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { TranslationKey } from '@/core/i18n/translations';
import { useI18n } from '@/core/i18n/useI18n';
import { colors, fonts, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

/** Les composants open source embarqués et leurs licences, sous forme de DONNÉES (testées). */
export const CREDITS: readonly { title: TranslationKey; text: TranslationKey }[] = [
  { title: 'about.recognition.title', text: 'about.recognition.text' },
  { title: 'about.photos.title', text: 'about.photos.text' },
  { title: 'about.engine.title', text: 'about.engine.text' },
  { title: 'about.maps.title', text: 'about.maps.text' },
];

/** Écran « Composants open source », ouvert par le petit lien en bas du menu. */
export function AboutScreen() {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel={t('common.back')} onPress={() => router.back()} />
        <Text accessibilityRole="header" style={styles.title}>
          {t('menu.credits')}
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {CREDITS.map((c) => (
          <View key={c.title} style={styles.block}>
            <Text style={styles.subtitle}>{t(c.title)}</Text>
            <Text style={styles.text}>{t(c.text)}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  content: { padding: spacing.lg, gap: spacing.lg },
  block: { gap: spacing.xs },
  subtitle: { fontFamily: fonts.bodyBold, fontSize: 15, color: colors.ink },
  text: { fontFamily: fonts.body, fontSize: 14, lineHeight: 20, color: colors.muted },
});
