import { initialsOf } from '@/shared/ui/Avatar';

import { formatDate, formatMessageTime } from '../format';

const at = (day: number, hours: number, minutes: number) => new Date(2026, 10, day, hours, minutes).getTime();

describe('formats de la fiche spot', () => {
  it('écrit la date de création en français', () => {
    expect(formatDate(at(23, 9, 0))).toBe('23 nov. 2026');
  });

  it('heure d’un message : à l’instant, aujourd’hui, ou avec la date', () => {
    const now = at(23, 12, 0);
    expect(formatMessageTime(now - 20_000, now)).toBe('À l’instant');
    expect(formatMessageTime(at(23, 7, 40), now)).toBe('07:40');
    expect(formatMessageTime(at(18, 10, 5), now)).toBe('18 nov. · 10:05');
  });

  it('initiales de l’avatar', () => {
    expect(initialsOf('Karim B.')).toBe('KB');
    expect(initialsOf('léa')).toBe('L');
    expect(initialsOf('  ')).toBe('?');
  });
});
