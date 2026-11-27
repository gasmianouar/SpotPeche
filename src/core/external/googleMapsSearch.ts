/**
 * Liens Google Maps « recherche autour de moi » (format officiel des liens Google Maps).
 * Sans position dans le lien, Google Maps cherche autour de la position actuelle du téléphone.
 */

/** Lien universel : ouvre l'app Google Maps si elle est installée (Android), sinon le site. */
export function googleMapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/** Schéma de l'app Google Maps sur iPhone (comgooglemaps://). */
export function googleMapsAppSearchUrl(query: string): string {
  return `comgooglemaps://?q=${encodeURIComponent(query)}`;
}
