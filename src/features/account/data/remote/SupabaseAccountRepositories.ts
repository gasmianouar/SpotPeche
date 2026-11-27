import type { SupabaseClient } from '@supabase/supabase-js';

import { authRedirectUrl, runOAuthBrowser } from '@/core/supabase/oauthBrowser';
import { throwIfError } from '@/core/supabase/supabaseClient';
import { AUTH_PROVIDERS, type AuthProvider } from '@/features/auth/domain/entities/User';

import type { AccountDataEraser, PublicContentChoice } from '../../domain/ports/AccountDataEraser';
import type { AccountRepository } from '../../domain/repositories/AccountRepository';

/** Comptes de connexion associés (identités Supabase Auth). */
export class SupabaseAccountRepository implements AccountRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async linkedProviders(): Promise<AuthProvider[]> {
    const { identities } = throwIfError(await this.supabase.auth.getUserIdentities());
    return AUTH_PROVIDERS.filter((provider) => identities.some((identity) => identity.provider === provider));
  }

  /** Associe Facebook, Apple ou Google au compte (même page de connexion que pour se connecter). */
  async link(_userId: string, provider: AuthProvider): Promise<void> {
    const { url } = throwIfError(
      await this.supabase.auth.linkIdentity({ provider, options: { redirectTo: authRedirectUrl(), skipBrowserRedirect: true } }),
    );
    if (!url) throw new Error('Adresse de connexion manquante');
    const params = await runOAuthBrowser(url);
    if (params.code) throwIfError(await this.supabase.auth.exchangeCodeForSession(params.code));
    else if (params.access_token) {
      throwIfError(
        await this.supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token }),
      );
    }
  }

  /**
   * Rien à faire ici : la suppression côté serveur a besoin du choix « tout supprimer / garder anonyme »,
   * elle est donc faite en une fois par SupabaseAccountDataEraser (fonction serveur « delete-account »).
   */
  async deleteAccount(): Promise<void> {}
}

/**
 * Suppression du compte sur le serveur : la fonction « delete-account » efface les données
 * (règles de la base), les photos du stockage, puis le compte de connexion.
 */
export class SupabaseAccountDataEraser implements AccountDataEraser {
  constructor(private readonly supabase: SupabaseClient) {}

  async erase(_userId: string, publicContent: PublicContentChoice): Promise<void> {
    const { error } = await this.supabase.functions.invoke('delete-account', { body: { publicContent } });
    if (error) throw new Error(error.message);
    // La session n'est plus valable : on la retire du téléphone.
    await this.supabase.auth.signOut({ scope: 'local' });
  }
}

/** Enchaîne plusieurs effaceurs (serveur d'abord, puis données gardées sur le téléphone). */
export class CompositeAccountDataEraser implements AccountDataEraser {
  constructor(private readonly erasers: readonly AccountDataEraser[]) {}

  async erase(userId: string, publicContent: PublicContentChoice): Promise<void> {
    for (const eraser of this.erasers) await eraser.erase(userId, publicContent);
  }
}
