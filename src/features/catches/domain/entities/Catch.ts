import type { Coordinates } from '@/shared/domain/Coordinates';

/**
 * Une PRISE : une photo publiée par l'utilisateur sur un spot,
 * soit à la création de son spot, soit dans un message de la discussion.
 */
export interface Catch {
  /** Unique pour chaque photo : `<source>:<index de la photo>`. */
  readonly id: string;
  readonly photoUri: string;
  /** Le lieu de la prise : le spot où la photo a été publiée. */
  readonly spotId: string;
  readonly placeName: string;
  readonly coordinates: Coordinates;
  /** Date de la prise (date de publication), en millisecondes depuis 1970. */
  readonly takenAt: number;
}
