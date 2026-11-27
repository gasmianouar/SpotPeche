import { AUTH_PROVIDERS, type AuthProvider, type User } from '@/features/auth/domain/entities/User';

import type { AccountRepository } from '../repositories/AccountRepository';

export interface ProviderLink {
  readonly provider: AuthProvider;
  readonly linked: boolean;
  /** Le fournisseur utilisé pour la connexion en cours (ne peut pas être retiré). */
  readonly current: boolean;
}

/** CAS D'USAGE : « quels comptes de connexion sont associés ? » (les 3, dans l'ordre d'affichage). */
export class GetLinkedProviders {
  constructor(private readonly accountRepository: AccountRepository) {}

  async execute(user: Pick<User, 'id' | 'provider'>): Promise<ProviderLink[]> {
    const linked = new Set<AuthProvider>([user.provider, ...(await this.accountRepository.linkedProviders(user.id))]);
    return AUTH_PROVIDERS.map((provider) => ({ provider, linked: linked.has(provider), current: provider === user.provider }));
  }
}

/** CAS D'USAGE : « associer un autre compte de connexion ». */
export class LinkProvider {
  constructor(private readonly accountRepository: AccountRepository) {}

  execute(userId: string, provider: AuthProvider): Promise<void> {
    if (!userId) return Promise.reject(new Error('Utilisateur non connecté'));
    return this.accountRepository.link(userId, provider);
  }
}
