import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, spacing } from '@/core/theme/tokens';

/** Écran Météo : simple emplacement pour ce sprint, il sera construit plus tard. */
export function WeatherScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.screen}>
      <View style={styles.content}>
        <Ionicons name="cloud-outline" size={48} color={colors.primary} />
        <Text accessibilityRole="header" style={styles.title}>
          Météo
        </Text>
        <Text style={styles.text}>Cet écran sera construit dans un prochain sprint.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.ground },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md, padding: spacing.xl },
  title: { fontFamily: fonts.displayBold, fontSize: 24, color: colors.ink },
  text: { fontFamily: fonts.body, fontSize: 15, color: colors.muted, textAlign: 'center' },
});
