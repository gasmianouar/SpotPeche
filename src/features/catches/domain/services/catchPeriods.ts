import type { Catch } from '../entities/Catch';

/** Les filtres de l'écran « Mes prises ». */
export type CatchPeriod = 'all' | 'year' | 'month';

/** Les filtres, dans l'ordre d'affichage (leurs libellés sont traduits par l'écran). */
export const CATCH_PERIODS: readonly CatchPeriod[] = ['all', 'year', 'month'];

/** Garde les prises de la période choisie (année ou mois en cours, selon l'heure du téléphone). */
export function filterByPeriod(catches: readonly Catch[], period: CatchPeriod, now: Date = new Date()): Catch[] {
  if (period === 'all') return [...catches];
  return catches.filter((c) => {
    const taken = new Date(c.takenAt);
    const sameYear = taken.getFullYear() === now.getFullYear();
    return period === 'year' ? sameYear : sameYear && taken.getMonth() === now.getMonth();
  });
}
