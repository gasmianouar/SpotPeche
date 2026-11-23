const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

const pad = (n: number) => String(n).padStart(2, '0');

/** « 23 nov. 2026 » */
export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** Heure d'un message : « À l’instant », « 07:40 » (aujourd'hui) ou « 23 nov. · 07:40 ». */
export function formatMessageTime(ms: number, now: number = Date.now()): string {
  if (now - ms >= 0 && now - ms < 60_000) return 'À l’instant';
  const d = new Date(ms);
  const today = new Date(now);
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  const sameDay =
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();
  return sameDay ? time : `${d.getDate()} ${MONTHS[d.getMonth()]} · ${time}`;
}
