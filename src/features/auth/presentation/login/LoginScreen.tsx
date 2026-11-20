import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import { SocialSignInButton } from './components/SocialSignInButton';
import { useLoginViewModel } from './useLoginViewModel';

/**
 * VUE de l'écran de connexion (écran 1 de la maquette).
 * Elle lit uiState et appelle signIn : aucune logique métier ici.
 */
export function LoginScreen() {
  const { uiState, signIn } = useLoginViewModel();
  const isBusy = uiState.loadingProvider !== null;

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />

      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.logo}>
            <Ionicons name="location-outline" size={28} color={colors.night} />
          </View>
          <Text style={styles.brand}>Spot</Text>
        </View>
        <Text accessibilityRole="header" style={styles.title}>
          Vos coins de pêche, partagés entre passionnés.
        </Text>
        <Text style={styles.subtitle}>
          Repérez les spots autour de vous, enregistrez les vôtres et consultez la météo avant de partir.
        </Text>
      </View>

      <View style={styles.actions}>
        <SocialSignInButton
          label="Continuer avec Facebook"
          icon="logo-facebook"
          backgroundColor={colors.facebook}
          loading={uiState.loadingProvider === 'facebook'}
          disabled={isBusy}
          onPress={() => signIn('facebook')}
        />
        {/* Apple impose « Se connecter avec Apple » sur iOS quand on propose Facebook. */}
        {Platform.OS === 'ios' && (
          <SocialSignInButton
            label="Continuer avec Apple"
            icon="logo-apple"
            backgroundColor={colors.apple}
            loading={uiState.loadingProvider === 'apple'}
            disabled={isBusy}
            onPress={() => signIn('apple')}
          />
        )}
        {uiState.errorMessage && (
          <Text accessibilityRole="alert" style={styles.error}>
            {uiState.errorMessage}
          </Text>
        )}
        <Text style={styles.legal}>
          En continuant, vous acceptez les Conditions d'utilisation et la Politique de confidentialité.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.night },
  hero: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: spacing.xxl, gap: spacing.lg },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: fonts.displayBold, fontSize: 44, color: colors.surface, letterSpacing: -1 },
  title: { fontFamily: fonts.display, fontSize: 30, lineHeight: 35, color: colors.surface },
  subtitle: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: colors.nightText },
  actions: { padding: spacing.xl, paddingBottom: spacing.xxl, gap: spacing.md },
  error: { fontFamily: fonts.bodyMedium, fontSize: 14, color: '#FFB4AB', textAlign: 'center' },
  legal: { fontFamily: fonts.body, fontSize: 13, lineHeight: 20, color: colors.nightText, textAlign: 'center' },
});
