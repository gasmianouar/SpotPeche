import Ionicons from '@expo/vector-icons/Ionicons';
import { StatusBar } from 'expo-status-bar';
import { ImageBackground, Platform, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/core/i18n/useI18n';
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
  const { t, isRTL, language, languages, choose } = useI18n();
  const isBusy = uiState.loadingProvider !== null;
  // Arabe : texte aligné à droite, lu de droite à gauche.
  const direction = isRTL ? styles.rtl : styles.ltr;

  return (
    <ImageBackground source={SEA_BACKGROUND} resizeMode="cover" style={styles.background}>
      <StatusBar style="light" />
      <SafeAreaView style={styles.screen}>
        <View style={styles.hero}>
          <View style={[styles.brandRow, isRTL && styles.rowReverse]}>
            <View style={styles.logo}>
              <Ionicons name="location-outline" size={28} color={colors.night} />
            </View>
            <Text style={styles.brand}>Spot</Text>
          </View>
          <Text accessibilityRole="header" style={[styles.title, direction]}>
            {t('login.title')}
          </Text>
          <Text style={[styles.subtitle, direction]}>{t('login.subtitle')}</Text>
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
          {uiState.errorKey && (
            <Text accessibilityRole="alert" style={styles.error}>
              {t(uiState.errorKey)}
            </Text>
          )}
        </View>

        <View style={styles.footer}>
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
  rowReverse: { flexDirection: 'row-reverse' },
  logo: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  brand: { fontFamily: fonts.displayBold, fontSize: 44, color: colors.surface, letterSpacing: -1 },
  title: { fontFamily: fonts.display, fontSize: 28, lineHeight: 34, color: colors.surface, ...textShadow },
  subtitle: { fontFamily: fonts.body, fontSize: 16, lineHeight: 24, color: '#DCEBEC', ...textShadow },
  ltr: { textAlign: 'left', writingDirection: 'ltr' },
  rtl: { textAlign: 'right', writingDirection: 'rtl' },
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
  footer: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xl },
});
