import type { AuthProvider, User } from '../domain/entities/User';
import type { AuthRepository } from '../domain/repositories/AuthRepository';

/**
 * Implémentation SIMULÉE de AuthRepository pour le sprint 1.
 *
 * Elle attend un peu (comme un vrai réseau) puis renvoie un utilisateur de démo.
 * Au sprint Auth, on écrira FacebookAppleAuthRepository qui implémente la même
 * interface : seul le fichier core/di/container.ts changera (le O de SOLID :
 * ouvert à l'extension, fermé à la modification).
 */
export class FakeAuthRepository implements AuthRepository {
  constructor(private readonly delayMs = 700) {}

  async signIn(provider: AuthProvider): Promise<User> {
    await new Promise((resolve) => setTimeout(resolve, this.delayMs));
    return { id: 'me', displayName: 'Pêcheur démo', photoUrl: null, provider };
  }

  async signOut(): Promise<void> {
    // Rien à nettoyer dans la version simulée.
  }
}
