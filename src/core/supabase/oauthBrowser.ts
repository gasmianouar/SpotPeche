import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';

/** L'adresse de retour dans l'app après la connexion (spotpeche://auth/callback). */
export const authRedirectUrl = () => Linking.createURL('auth/callback');

/** La connexion a été fermée par l'utilisateur (pas une erreur à afficher). */
export class OAuthCancelledError extends Error {
  constructor() {
    super('Connexion annulée');
    this.name = 'OAuthCancelledError';
  }
}

/** Lit les paramètres d'une adresse de retour, qu'ils soient après « ? » ou après « # ». */
export function readCallbackParams(url: string): Record<string, string> {
  const params: Record<string, string> = {};
  for (const part of [url.split('?')[1]?.split('#')[0], url.split('#')[1]]) {
    if (!part) continue;
    for (const pair of part.split('&')) {
      const [key, value = ''] = pair.split('=');
      if (key) params[decodeURIComponent(key)] = decodeURIComponent(value.replace(/\+/g, ' '));
    }
  }
  return params;
}

/**
 * Ouvre la page de connexion du fournisseur (Facebook, Apple, Google) dans un navigateur
 * intégré, puis renvoie les paramètres de retour (jetons de session ou code d'erreur).
 */
export async function runOAuthBrowser(authorizeUrl: string): Promise<Record<string, string>> {
  const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, authRedirectUrl());
  if (result.type !== 'success') throw new OAuthCancelledError();
  const params = readCallbackParams(result.url);
  if (params.error) throw new Error(params.error_description || params.error);
  return params;
}
