import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
import { useLanguageChooser } from '@/core/i18n/useLanguageChooser';
import { colors, fonts, radius, spacing } from '@/core/theme/tokens';

import { LanguagePicker } from './components/LanguagePicker';
import { SocialSignInButton } from './components/SocialSignInButton';
import { useLoginViewModel } from './useLoginViewModel';

const SEA_BACKGROUND = require('../../../../../assets/login-sea.jpg');

/**
 * VUE de l'écran de connexion (écran 1 de la maquette).
 * - Fond : la mer au coucher du soleil.
 * - En haut : le logo et l'accroche. Au milieu : la connexion. En bas : la langue.
 * Elle lit uiState et appelle signIn : aucune logique métier ici.
 */
export function LoginScreen() {
  const { uiState, signIn } = useLoginViewModel();
  const { t, language, languages } = useI18n();
  const choose = useLanguageChooser();
  const isBusy = uiState.loadingProvider !== null;

  return (
    <ImageBackground source={SEA_BACKGROUND} resizeMode="cover" style={styles.background}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.screen}>
        <View style={styles.hero}>
          <View style={styles.brandRow}>
            <View style={styles.logo}>
              <Ionicons name="location-outline" size={28} color={colors.night} />
            </View>
            <Text style={styles.brand}>Spot</Text>
          </View>
          <Text accessibilityRole="header" style={styles.title}>
            {t('login.title')}
          </Text>
          <Text style={styles.subtitle}>{t('login.subtitle')}</Text>
        </View>

        {/* La connexion, presque au milieu de l'écran. */}
        <View style={styles.actions}>
          <SocialSignInButton
            label={t('login.continueFacebook')}
            icon="logo-facebook"
            backgroundColor={colors.facebook}
            loading={uiState.loadingProvider === 'facebook'}
            disabled={isBusy}
            onPress={() => signIn('facebook')}
          />
          {/* Apple impose « Se connecter avec Apple » sur iOS quand on propose Facebook. */}
          {Platform.OS === 'ios' && (
            <SocialSignInButton
              label={t('login.continueApple')}
              icon="logo-apple"
              backgroundColor={colors.apple}
              loading={uiState.loadingProvider === 'apple'}
              disabled={isBusy}
              onPress={() => signIn('apple')}
            />
          )}
          {/* Google : sur Android et iOS. Bouton clair, comme le demande Google pour son logo. */}
          <SocialSignInButton
            label={t('login.continueGoogle')}
            icon="logo-google"
            backgroundColor={colors.surface}
            foregroundColor={colors.googleText}
            borderColor={colors.googleBorder}
            loading={uiState.loadingProvider === 'google'}
            disabled={isBusy}
            onPress={() => signIn('google')}
          />
          {uiState.errorKey && (
            <Text accessibilityRole="alert" style={styles.error}>
              {t(uiState.errorKey)}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.legal}>{t('login.legal')}</Text>
          <LanguagePicker label={t('login.language')} languages={languages} selected={language} onSelect={choose} />
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
}

const textShadow = { textShadowColor: 'rgba(0,0,0,0.35)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 6 };

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.night },
  screen: { flex: 1 },
  hero: { paddingTop: spacing.xxl, paddingHorizontal: spacing.xxl, gap: spacing.md },
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
  // textAlign 'left' : en arabe, l'app passe en droite-à-gauche et ce « left » devient la droite.
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.surface, textAlign: 'left', ...textShadow },
  subtitle: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: '#DCEBEC', textAlign: 'left', ...textShadow },
  // flex: 1 + centré : le bouton se place au milieu de la place libre, donc presque au milieu de l'écran.
  actions: { flex: 1, justifyContent: 'center', paddingHorizontal: spacing.xl, gap: spacing.md },
  error: {
    fontFamily: fonts.bodyMedium,
    fontSize: 14,
    color: '#FFD3CC',
    textAlign: 'center',
    backgroundColor: 'rgba(8,26,29,0.6)',
    borderRadius: radius.sm,
    overflow: 'hidden',
    padding: spacing.sm,
  },
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl, gap: spacing.md },
  legal: { fontFamily: fonts.body, fontSize: 12, lineHeight: 17, color: colors.surface, textAlign: 'center', ...textShadow },
});
