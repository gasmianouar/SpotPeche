import type { SpotVisibility } from '@/features/spots/domain/entities/Spot';

/** Les notifications que l'utilisateur peut couper une à une. */
export interface NotificationPreferences {
  /** Quelqu'un répond à un de mes messages. */
  readonly replies: boolean;
  /** Nouveaux messages, prises ou appâts sur mes spots. */
  readonly mySpotsActivity: boolean;
  /** Indice de pêche de 4/5 ou plus sur un de mes spots. */
  readonly goodConditions: boolean;
  /** Nouveaux spots publics près de moi (au plus une fois par semaine). */
  readonly nearbySpots: boolean;
}

export type NotificationKind = keyof NotificationPreferences;

export const NOTIFICATION_KINDS: readonly NotificationKind[] = ['replies', 'mySpotsActivity', 'goodConditions', 'nearbySpots'];

/** Réglages du compte, gardés sur le téléphone. */
export interface AccountPreferences {
  readonly notifications: NotificationPreferences;
  /** Visibilité proposée par défaut à la création d'un spot. */
  readonly defaultSpotVisibility: SpotVisibility;
}

/** Réglages de départ : peu de notifications, spots privés. */
export const DEFAULT_ACCOUNT_PREFERENCES: AccountPreferences = {
  notifications: { replies: true, mySpotsActivity: true, goodConditions: false, nearbySpots: false },
  defaultSpotVisibility: 'private',
};
