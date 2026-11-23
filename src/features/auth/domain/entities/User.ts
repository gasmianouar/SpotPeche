/** Les fournisseurs d'identité acceptés par Spot. */
export type AuthProvider = 'facebook' | 'apple';

/** L'utilisateur connecté, tel que le domaine le voit. */
export interface User {
  readonly id: string;
  readonly displayName: string;
  /** Photo de profil fournie par Facebook / Apple (null si aucune). */
  readonly photoUrl: string | null;
  readonly provider: AuthProvider;
}
