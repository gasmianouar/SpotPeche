import type { User } from '../entities/User';
import type { AuthRepository } from '../repositories/AuthRepository';

/**
 * CAS D'USAGE : « reprendre la session au démarrage de l'app ».
 * Avec un vrai serveur, on reste connecté d'une ouverture à l'autre ; sinon, personne n'est connecté.
 * Une erreur (stockage abîmé, réseau…) ne bloque jamais le démarrage : on revient à l'écran de connexion.
 */
export class RestoreSession {
  constructor(private readonly authRepository: AuthRepository) {}

  async execute(): Promise<User | null> {
    try {
      return (await this.authRepository.currentUser?.()) ?? null;
    } catch {
      return null;
    }
  }
}
