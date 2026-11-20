import type { Coordinates } from '@/shared/domain/Coordinates';

/** Un coin de pêche enregistré par un utilisateur. */
export interface Spot {
  readonly id: string;
  readonly name: string;
  readonly coordinates: Coordinates;
  readonly ownerId: string;
}

/**
 * Un spot prêt à être affiché sur la carte : on sait déjà s'il appartient
 * à l'utilisateur connecté (vert) ou à la communauté (rouge).
 */
export interface MapSpot {
  readonly spot: Spot;
  readonly isMine: boolean;
}
