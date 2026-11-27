/**
 * Réglages lus au moment de la compilation de l'app.
 * Expo remplace `process.env.EXPO_PUBLIC_…` par la valeur du fichier `.env` (à la racine).
 * Ne mettez JAMAIS de secret ici : tout ce qui est EXPO_PUBLIC_ finit dans l'app, lisible par tous.
 */
export const env = {
  /** Adresse du serveur de l'agent IA (vide = pas d'IA, algorithme local seulement). */
  spotAiUrl: process.env.EXPO_PUBLIC_SPOT_AI_URL ?? '',
  /** Adresse du projet Supabase (vide = pas de serveur : tout reste sur le téléphone, connexion simulée). */
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? '',
  /**
   * Clé PUBLIQUE du projet Supabase (« publishable » / « anon »). Elle peut être dans l'app :
   * ce sont les règles de sécurité de la base (RLS) qui protègent les données.
   * Jamais la clé « service_role » / « secret » ici.
   */
  supabasePublishableKey: process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '',
};
