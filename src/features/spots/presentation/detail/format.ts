import { formatDayMonth, formatFullDate, formatTime } from '@/core/i18n/dates';
import type { Language } from '@/core/i18n/languages';
import { translate } from '@/core/i18n/translations';

/** « 23 nov. 2026 » · « Nov 23, 2026 » · « 23 نوفمبر 2026 » */
export function formatDate(ms: number, language: Language): string {
  return formatFullDate(language, new Date(ms));
}

/** Heure d'un message : « À l’instant », « 07:40 » (aujourd'hui) ou « 23 nov. · 07:40 ». */
export function formatMessageTime(ms: number, language: Language, now: number = Date.now()): string {
  if (now - ms >= 0 && now - ms < 60_000) return translate(language, 'common.justNow');
  const d = new Date(ms);
  const today = new Date(now);
  const sameDay =
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  return sameDay ? formatTime(d) : `${formatDayMonth(language, d)} · ${formatTime(d)}`;
}
