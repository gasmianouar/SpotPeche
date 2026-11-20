import type { AuthProvider, User } from '../entities/User';
import type { AuthRepository } from '../repositories/AuthRepository';

/**
 * CAS D'USAGE : « se connecter avec un fournisseur ».
 *
 * Une classe = une seule action métier (le S de SOLID : Single Responsibility).
 * Elle reçoit le repository dans son constructeur au lieu de le créer
 * elle-même : c'est l'injection de dépendances.
 */
export class SignInWithProvider {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(provider: AuthProvider): Promise<User> {
    const user = await this.authRepository.signIn(provider);
    if (!user.id) {
      throw new Error('Utilisateur invalide renvoyé par le fournisseur');
    }
    return user;
  }
}
