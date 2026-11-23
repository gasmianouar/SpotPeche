import type { Coordinates } from '@/shared/domain/Coordinates';

/** Activité des poissons constatée sur le spot. */
export type FishActivity = 'good' | 'medium' | 'none';

/** Les niveaux d'activité, dans l'ordre d'affichage. */
export const FISH_ACTIVITIES: readonly FishActivity[] = ['good', 'medium', 'none'];

export const isFishActivity = (value: string | null): value is FishActivity =>
  FISH_ACTIVITIES.includes(value as FishActivity);

/** L'avis d'un pêcheur sur l'activité d'un spot (« ça mord ? ») : un seul par personne. */
export interface ActivityVote {
  readonly spotId: string;
  readonly userId: string;
  readonly activity: FishActivity;
}

/** Un coin de pêche enregistré par un utilisateur. */
export interface Spot {
  readonly id: string;
  readonly name: string;
  readonly coordinates: Coordinates;
  readonly ownerId: string;
  /** Nom du créateur (repris de son profil Facebook au moment de la création). */
  readonly ownerName: string;
  /** Photo de profil du créateur, si son compte en a une. */
  readonly ownerPhotoUrl: string | null;
  /** Identifiants du catalogue des espèces (ex. 'brochet'). */
  readonly speciesIds: readonly string[];
  /** Identifiants du catalogue des appâts (ex. 'shad'). */
  readonly baitIds: readonly string[];
  readonly activity: FishActivity | null;
  readonly description: string;
  /** Adresses locales des photos du spot. */
  readonly photoUris: readonly string[];
  /** Date de création, en millisecondes depuis 1970. */
  readonly createdAt: number;
}

/**
 * Un spot prêt à être affiché sur la carte : on sait déjà s'il appartient
 * à l'utilisateur connecté (vert) ou à la communauté (rouge).
 */
export interface MapSpot {
  readonly spot: Spot;
  readonly isMine: boolean;
}
