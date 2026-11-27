import type { AuthProvider } from '@/features/auth/domain/entities/User';

/**
 * Contrat du COMPTE côté serveur (distinct de la connexion elle-même).
 * Aujourd'hui simulé (FakeAccountRepository) ; demain branché sur le vrai backend
 * en ne changeant que core/di/container.ts.
 */
export interface AccountRepository {
  /** Les fournisseurs déjà associés au compte (en plus de celui utilisé pour se connecter). */
  linkedProviders(userId: string): Promise<AuthProvider[]>;
  /** Associe un autre fournisseur au compte (se connecter ensuite avec Apple ou Google, par exemple). */
  link(userId: string, provider: AuthProvider): Promise<void>;
  /** Supprime le compte et ses données sur le serveur. */
  deleteAccount(userId: string): Promise<void>;
}
