import { catchCountLabel, formatCatchLongDate, formatCatchShortDate } from '../catchFormat';

describe('catchFormat', () => {
  const now = new Date(2026, 10, 27);

  it('date courte : sans l’année en cours, avec une autre année', () => {
    expect(formatCatchShortDate(new Date(2026, 10, 23).getTime(), now)).toBe('23 nov.');
    expect(formatCatchShortDate(new Date(2025, 9, 4).getTime(), now)).toBe('4 oct. 2025');
  });

  it('date complète avec l’heure', () => {
    expect(formatCatchLongDate(new Date(2026, 10, 23, 17, 5).getTime())).toBe('23 nov. 2026 à 17 h 05');
  });

  it('compte les prises', () => {
    expect([0, 1, 8].map(catchCountLabel)).toEqual(['Aucune prise', '1 prise', '8 prises']);
  });
});
