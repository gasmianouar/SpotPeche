import type { Coordinates } from '@/shared/domain/Coordinates';

import type { CatalogItem } from '../entities/Catalog';
import type { Spot } from '../entities/Spot';

/** Lien OpenStreetMap vers un point (gratuit, s'ouvre sur tous les téléphones). */
export function openStreetMapUrl({ latitude, longitude }: Coordinates, zoom = 16): string {
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
}

/** Texte envoyé par « Partager » : quelques infos utiles et le lien vers la carte. */
export function spotShareText(spot: Spot, species: readonly CatalogItem[]): string {
  const lines = [`Spot de pêche partagé avec Spot 🎣`];
  if (species.length > 0) lines.push(`Espèces : ${species.map((s) => s.name).join(', ')}`);
  lines.push(openStreetMapUrl(spot.coordinates));
  return lines.join('\n');
}
