const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const pad = (n: number) => String(n).padStart(2, '0');

/** Date courte sur la photo : « 23 nov. », avec l'année si ce n'est pas l'année en cours. */
export function formatCatchShortDate(ms: number, now: Date = new Date()): string {
  const d = new Date(ms);
  const day = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === now.getFullYear() ? day : `${day} ${d.getFullYear()}`;
}

/** Date complète, sous la photo en grand : « 23 nov. 2026 à 17 h 20 ». */
export function formatCatchLongDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()} à ${d.getHours()} h ${pad(d.getMinutes())}`;
}

/** « 3 prises », « 1 prise », « Aucune prise ». */
export function catchCountLabel(count: number): string {
  if (count === 0) return 'Aucune prise';
  return `${count} prise${count > 1 ? 's' : ''}`;
}
