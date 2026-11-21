import Ionicons from '@expo/vector-icons/Ionicons';
import { useRouter } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/core/theme/tokens';
import { IconButton } from '@/shared/ui/IconButton';

/**
 * Écran « Appâts » : les magasins qui vendent des appâts.
 * Emplacement prêt pour ce sprint ; la liste sera construite au prochain.
 */
export function BaitShopsScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.screen}>
      <View style={styles.header}>
        <IconButton icon="chevron-back" accessibilityLabel="Retour" onPress={() => router.back()} />
        <Text accessibilityRole="header" style={styles.title}>
          Appâts
        </Text>
      </View>
      <View style={styles.content}>
        <Ionicons name="storefront-outline" size={48} color={colors.primary} />
        <Text style={styles.subtitle}>Magasins d'appâts près de vous</Text>
        <Text style={styles.text}>
          Bientôt ici : les magasins de pêche et points de vente d'appâts autour de vous, avec horaires et itinéraire.
        </Text>
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
  title: { fontFamily: fonts.displayBold, fontSize: 20, color: colors.ink },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  subtitle: { fontFamily: fonts.bodyBold, fontSize: 18, color: colors.ink, textAlign: 'center' },
  text: { fontFamily: fonts.body, fontSize: 15, lineHeight: 22, color: colors.muted, textAlign: 'center' },
});
