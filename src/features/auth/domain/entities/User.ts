/** Les fournisseurs d'identité acceptés par Spot. */
export type AuthProvider = 'facebook' | 'apple';

/** L'utilisateur connecté, tel que le domaine le voit. */
export interface User {
  readonly id: string;
  readonly displayName: string;
  readonly provider: AuthProvider;
}
