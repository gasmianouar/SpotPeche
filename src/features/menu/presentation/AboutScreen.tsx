import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

/** Les composants open source embarqués et leurs licences, sous forme de DONNÉES (testées). */
export const CREDITS: readonly { title: string; text: string }[] = [
  {
    title: 'Reconnaissance des espèces',
    text: 'Classifieur Fishial.ai (github.com/fishial/fish-identification), licence MIT. Détecteur Community Fish Detector, RF-DETR Nano (github.com/filippovarini/community-fish-detector), licence Apache 2.0. L’analyse se fait sur le téléphone : aucune photo n’est envoyée.',
  },
  {
    title: 'Photos de référence',
    text: 'Photos iNaturalist sous licences Creative Commons, utilisées pour régler la reconnaissance.',
  },
  {
    title: 'Moteur de calcul',
    text: 'ExecuTorch (PyTorch), licence BSD ; react-native-executorch (Software Mansion), licence MIT.',
  },
  {
    title: 'Cartes et météo',
    text: 'Fonds de carte © contributeurs OpenStreetMap. Prévisions météo : Open-Meteo.',
  },
];

/** Écran « Composants open source », ouvert par le petit lien en bas du menu. */
export function AboutScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Retour" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={styles.title}>
          Composants open source
        </Text>
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        {CREDITS.map((c) => (
          <View key={c.title} style={styles.block}>
            <Text style={styles.subtitle}>{c.title}</Text>
            <Text style={styles.text}>{c.text}</Text>
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
