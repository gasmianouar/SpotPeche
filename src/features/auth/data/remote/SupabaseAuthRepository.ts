import type { SupabaseClient, User as SupabaseUser } from '@supabase/supabase-js';

import { OAuthCancelledError, authRedirectUrl, runOAuthBrowser } from '@/core/supabase/oauthBrowser';
import { throwIfError } from '@/core/supabase/supabaseClient';

import { AUTH_PROVIDERS, type AuthProvider, type User } from '../../domain/entities/User';
import { SignInCancelledError, type AuthRepository } from '../../domain/repositories/AuthRepository';

/** Compte Supabase → utilisateur du domaine (nom et photo fournis par Facebook, Apple ou Google). */
export function toDomainUser(user: SupabaseUser): User {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const text = (value: unknown) => (typeof value === 'string' && value.trim() ? value.trim() : null);
  const provider = AUTH_PROVIDERS.find((p) => p === user.app_metadata?.provider) ?? 'google';
  return {
    id: user.id,
    displayName: text(meta.full_name) ?? text(meta.name) ?? text(user.email?.split('@')[0]) ?? 'Pêcheur',
    photoUrl: text(meta.avatar_url) ?? text(meta.picture),
    provider,
  };
}

/**
 * Connexion RÉELLE avec Supabase Auth : la page du fournisseur s'ouvre dans un navigateur intégré,
 * puis Supabase renvoie les jetons de session à l'app (spotpeche://auth/callback).
 * Les fournisseurs s'activent dans le tableau de bord Supabase (voir docs/BACKEND.md).
 */
export class SupabaseAuthRepository implements AuthRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async signIn(provider: AuthProvider): Promise<User> {
    const { url } = throwIfError(
      await this.supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo: authRedirectUrl(), skipBrowserRedirect: true },
      }),
    );
    if (!url) throw new Error('Adresse de connexion manquante');

    let params: Record<string, string>;
    try {
      params = await runOAuthBrowser(url);
    } catch (error) {
      if (error instanceof OAuthCancelledError) throw new SignInCancelledError();
      throw error;
    }

    const { session } = params.code
      ? throwIfError(await this.supabase.auth.exchangeCodeForSession(params.code))
      : throwIfError(
          await this.supabase.auth.setSession({ access_token: params.access_token, refresh_token: params.refresh_token }),
        );
    if (!session) throw new Error('Session manquante');
    return toDomainUser(session.user);
  }

  async signOut(): Promise<void> {
    await this.supabase.auth.signOut();
  }

  /** La session gardée sur le téléphone (on reste connecté après un redémarrage), ou null. */
  async currentUser(): Promise<User | null> {
    const { data } = await this.supabase.auth.getSession();
    return data.session ? toDomainUser(data.session.user) : null;
  }
}
