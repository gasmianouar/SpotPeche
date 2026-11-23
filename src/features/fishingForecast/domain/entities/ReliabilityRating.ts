/** « L'indice était-il fiable ? » : 👍 / 😐 / 👎 */
export type ReliabilityValue = 'reliable' | 'so-so' | 'wrong';

export const RELIABILITY_VALUES: readonly ReliabilityValue[] = ['reliable', 'so-so', 'wrong'];

export const isReliabilityValue = (value: string): value is ReliabilityValue =>
  RELIABILITY_VALUES.includes(value as ReliabilityValue);

/** L'avis d'un pêcheur sur la fiabilité de l'indice d'un spot (un seul par personne). */
export interface ReliabilityRating {
  readonly spotId: string;
  readonly userId: string;
  readonly value: ReliabilityValue;
}
