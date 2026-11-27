import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

import { env } from '@/core/config/env';

/** Vrai si l'adresse et la clé publique du projet Supabase sont dans le fichier .env. */
export const isSupabaseConfigured = (): boolean => Boolean(env.supabaseUrl && env.supabasePublishableKey);

let client: SupabaseClient | null = null;

/**
 * Le client Supabase de l'app (créé une seule fois, à la première utilisation).
 * La session est gardée dans le stockage local d'expo-sqlite : on reste connecté après redémarrage.
 */
export function getSupabase(): SupabaseClient {
  if (client) return client;
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase n’est pas configuré (EXPO_PUBLIC_SUPABASE_URL et EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY).');
  }
  client = createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      storage: globalThis.localStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
  // Le jeton de session n'est rafraîchi que quand l'app est au premier plan (économise la batterie).
  AppState.addEventListener('change', (state) => {
    if (state === 'active') client?.auth.startAutoRefresh();
    else client?.auth.stopAutoRefresh();
  });
  return client;
}

/** L'identifiant de l'utilisateur connecté, ou une erreur s'il n'y a pas de session. */
export async function requireUserId(supabase: SupabaseClient): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error('Non connecté');
  return id;
}

type SupabaseError = { message: string; code?: string };
/** Les données d'une réponse Supabase réussie (les réponses sont « succès | échec »). */
type SuccessData<R extends { data: unknown }> = [Extract<R, { error: null }>] extends [never]
  ? NonNullable<R['data']>
  : Extract<R, { error: null }>['data'];

/** Erreur Supabase → exception JavaScript (avec le message du serveur). */
export function throwIfError<R extends { data: unknown; error: SupabaseError | null }>(result: R): SuccessData<R> {
  if (result.error) {
    const error = new Error(result.error.message) as Error & { code?: string };
    error.code = result.error.code;
    throw error;
  }
  return result.data as SuccessData<R>;
}

/** Millisecondes (domaine) ↔ date ISO (PostgreSQL). */
export const toIso = (ms: number) => new Date(ms).toISOString();
export const fromIso = (iso: string | null | undefined) => (iso ? Date.parse(iso) : Date.now());
