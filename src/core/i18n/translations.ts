import type { Language } from './languages';

/**
 * Les textes traduits. Le français sert de référence : chaque langue doit avoir
 * exactement les mêmes clés (vérifié par le type et par un test).
 * Pour l'instant : l'écran de connexion. Les autres écrans suivront.
 */
const fr = {
  'login.title': 'Vos coins de pêche, partagés entre passionnés.',
  'login.subtitle': 'Repérez les spots autour de vous, enregistrez les vôtres et consultez la météo avant de partir.',
  'login.continueFacebook': 'Continuer avec Facebook',
  'login.continueApple': 'Continuer avec Apple',
  'login.error': 'La connexion a échoué. Vérifiez votre réseau et réessayez.',
  'login.language': 'Langue',
};

export type TranslationKey = keyof typeof fr;

export const TRANSLATIONS: Record<Language, Record<TranslationKey, string>> = {
  fr,
  en: {
    'login.title': 'Your fishing spots, shared between enthusiasts.',
    'login.subtitle': 'Find spots around you, save your own and check the weather before you go.',
    'login.continueFacebook': 'Continue with Facebook',
    'login.continueApple': 'Continue with Apple',
    'login.error': 'Sign-in failed. Check your network and try again.',
    'login.language': 'Language',
  },
  ar: {
    'login.title': 'أماكن صيدك، يتشاركها عشّاق الصيد.',
    'login.subtitle': 'اكتشف أماكن الصيد من حولك، واحفظ أماكنك، وتحقّق من الطقس قبل الخروج.',
    'login.continueFacebook': 'المتابعة باستخدام فيسبوك',
    'login.continueApple': 'المتابعة باستخدام Apple',
    'login.error': 'تعذّر تسجيل الدخول. تحقّق من اتصالك بالشبكة وحاول مرة أخرى.',
    'login.language': 'اللغة',
  },
};

export function translate(language: Language, key: TranslationKey): string {
  return TRANSLATIONS[language][key] ?? TRANSLATIONS.fr[key];
}
