import type { AuthProvider } from '@/features/auth/domain/entities/User';

import type { AccountRepository } from '../domain/repositories/AccountRepository';

/**
 * Compte SIMULÉ, comme FakeAuthRepository : il n'y a pas encore de serveur.
 * Il attend un peu (comme un vrai réseau) et garde les associations en mémoire.
 * À remplacer par l'implémentation du backend dans core/di/container.ts.
 */
export class FakeAccountRepository implements AccountRepository {
  private links = new Map<string, Set<AuthProvider>>();

  constructor(private readonly delayMs = 500) {}

  async linkedProviders(userId: string): Promise<AuthProvider[]> {
    return [...(this.links.get(userId) ?? [])];
  }

  async link(userId: string, provider: AuthProvider): Promise<void> {
    await this.wait();
    const set = this.links.get(userId) ?? new Set<AuthProvider>();
    set.add(provider);
    this.links.set(userId, set);
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.wait();
    this.links.delete(userId);
  }

  private wait() {
    return new Promise((resolve) => setTimeout(resolve, this.delayMs));
  }
}
