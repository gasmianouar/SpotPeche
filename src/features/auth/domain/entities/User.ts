/** Les fournisseurs d'identité acceptés par Spot. */
export type AuthProvider = 'facebook' | 'apple' | 'google';

/** Les fournisseurs, dans l'ordre d'affichage. */
export const AUTH_PROVIDERS: readonly AuthProvider[] = ['facebook', 'apple', 'google'];

/** Nom de marque du fournisseur (identique dans toutes les langues). */
export const PROVIDER_NAMES: Record<AuthProvider, string> = { facebook: 'Facebook', apple: 'Apple', google: 'Google' };

/** L'utilisateur connecté, tel que le domaine le voit. */
export interface User {
  readonly id: string;
  readonly displayName: string;
  /** Photo de profil fournie par Facebook / Apple / Google (null si aucune). */
  readonly photoUrl: string | null;
  readonly provider: AuthProvider;
}
