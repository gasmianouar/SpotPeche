import type { Language } from './languages';

/** Mois abrégés, dans chaque langue (l'arabe utilise les noms complets, déjà courts). */
const MONTHS: Record<Language, readonly string[]> = {
  fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'],
  en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
  ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
};

/** Jours abrégés, du dimanche au samedi. */
const DAYS: Record<Language, readonly string[]> = {
  fr: ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'],
  en: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  ar: ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
};

const pad = (n: number) => String(n).padStart(2, '0');

export const monthName = (language: Language, monthIndex: number) => MONTHS[language][monthIndex];
export const dayName = (language: Language, dayIndex: number) => DAYS[language][dayIndex];

/** « 23 nov. » · « Nov 23 » · « 23 نوفمبر » */
export function formatDayMonth(language: Language, d: Date): string {
  return language === 'en' ? `${monthName(language, d.getMonth())} ${d.getDate()}` : `${d.getDate()} ${monthName(language, d.getMonth())}`;
}

/** « 23 nov. 2026 » · « Nov 23, 2026 » · « 23 نوفمبر 2026 » */
export function formatFullDate(language: Language, d: Date): string {
  return language === 'en' ? `${formatDayMonth(language, d)}, ${d.getFullYear()}` : `${formatDayMonth(language, d)} ${d.getFullYear()}`;
}

/** « 07:40 » (24 h dans les trois langues : usage courant en France et au Maghreb). */
export const formatTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
