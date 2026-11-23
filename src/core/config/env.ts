/**
 * Réglages lus au moment de la compilation de l'app.
 * Expo remplace `process.env.EXPO_PUBLIC_…` par la valeur du fichier `.env` (à la racine).
 * Ne mettez JAMAIS de secret ici : tout ce qui est EXPO_PUBLIC_ finit dans l'app, lisible par tous.
 */
export const env = {
  /** Adresse du serveur de l'agent IA (vide = pas d'IA, algorithme local seulement). */
  spotAiUrl: process.env.EXPO_PUBLIC_SPOT_AI_URL ?? '',
};
