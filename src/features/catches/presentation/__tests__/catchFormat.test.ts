import { catchCountLabel, formatCatchLongDate, formatCatchShortDate } from '../catchFormat';

describe('catchFormat', () => {
  const now = new Date(2026, 10, 27);

  it('date courte : sans l’année en cours, avec une autre année', () => {
    expect(formatCatchShortDate(new Date(2026, 10, 23).getTime(), 'fr', now)).toBe('23 nov.');
    expect(formatCatchShortDate(new Date(2025, 9, 4).getTime(), 'fr', now)).toBe('4 oct. 2025');
    expect(formatCatchShortDate(new Date(2026, 10, 23).getTime(), 'en', now)).toBe('Nov 23');
    expect(formatCatchShortDate(new Date(2026, 10, 23).getTime(), 'ar', now)).toBe('23 نوفمبر');
  });

  it('date complète avec l’heure', () => {
    expect(formatCatchLongDate(new Date(2026, 10, 23, 17, 5).getTime(), 'fr')).toBe('23 nov. 2026 à 17:05');
    expect(formatCatchLongDate(new Date(2026, 10, 23, 17, 5).getTime(), 'en')).toBe('Nov 23, 2026 at 17:05');
  });

  it('compte les prises', () => {
    expect([0, 1, 8].map((n) => catchCountLabel(n, 'fr'))).toEqual(['Aucune prise', '1 prise', '8 prises']);
    expect(catchCountLabel(8, 'en')).toBe('8 catches');
  });
});
