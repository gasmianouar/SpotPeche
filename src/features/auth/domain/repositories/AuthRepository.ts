import type { AuthProvider, User } from '../entities/User';

/**
 * CONTRAT (interface) de l'authentification.
 *
 * Le domaine dit « j'ai besoin de quelqu'un qui sait connecter un utilisateur »,
 * sans savoir COMMENT (Facebook SDK, Firebase, faux pour les tests…).
 * C'est le D de SOLID : Dependency Inversion.
 */
export interface AuthRepository {
  signIn(provider: AuthProvider): Promise<User>;
  signOut(): Promise<void>;
}

/** Erreur métier : l'utilisateur a fermé la fenêtre de connexion. */
export class SignInCancelledError extends Error {
  constructor() {
    super('Connexion annulée');
    this.name = 'SignInCancelledError';
  }
}
