import { formatDayMonth, formatFullDate, formatTime } from '@/core/i18n/dates';
import type { Language } from '@/core/i18n/languages';
import { translate } from '@/core/i18n/translations';

/** Date courte sur la photo : « 23 nov. », avec l'année si ce n'est pas l'année en cours. */
export function formatCatchShortDate(ms: number, language: Language, now: Date = new Date()): string {
  const d = new Date(ms);
  return d.getFullYear() === now.getFullYear() ? formatDayMonth(language, d) : formatFullDate(language, d);
}

/** Date complète, sous la photo en grand : « 23 nov. 2026 à 17:05 ». */
export function formatCatchLongDate(ms: number, language: Language): string {
  const d = new Date(ms);
  return translate(language, 'common.atTime', { date: formatFullDate(language, d), time: formatTime(d) });
}

/** « Aucune prise », « 1 prise », « 3 prises » (et leurs équivalents). */
export function catchCountLabel(count: number, language: Language): string {
  if (count === 0) return translate(language, 'catches.none');
  if (count === 1) return translate(language, 'catches.one');
  return translate(language, 'catches.many', { count });
}
