import { defineTexts } from '@/core/i18n/defineTexts';

/** Textes de la visibilité d'un spot (création du spot, réglages du compte). */
export const visibilityTexts = defineTexts({
  fr: {
    'visibility.title': 'Qui peut voir ce spot ?',
    'visibility.private': 'Moi uniquement',
    'visibility.privateHint': 'Visible seulement par vous, même hors connexion.',
    'visibility.public': 'Communauté Spot',
    'visibility.publicHint': 'Visible par tous : votes, prises, appâts et messages ouverts.',
  },
  en: {
    'visibility.title': 'Who can see this spot?',
    'visibility.private': 'Only me',
    'visibility.privateHint': 'Visible only to you, even offline.',
    'visibility.public': 'Spot community',
    'visibility.publicHint': 'Visible to everyone: votes, catches, baits and messages are open.',
  },
  ar: {
    'visibility.title': 'من يمكنه رؤية هذا المكان؟',
    'visibility.private': 'أنا فقط',
    'visibility.privateHint': 'مرئي لك وحدك، حتى دون اتصال.',
    'visibility.public': 'مجتمع Spot',
    'visibility.publicHint': 'مرئي للجميع: التصويت والصيد والطُّعوم والرسائل مفتوحة.',
  },
});
