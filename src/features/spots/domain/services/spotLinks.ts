import type { Coordinates } from '@/shared/domain/Coordinates';

import type { CatalogItem } from '../entities/Catalog';
import type { Spot } from '../entities/Spot';

const point = ({ latitude, longitude }: Coordinates) => `${latitude.toFixed(6)},${longitude.toFixed(6)}`;

/** Lien OpenStreetMap vers un point (gratuit, s'ouvre sur tous les téléphones). */
export function openStreetMapUrl({ latitude, longitude }: Coordinates, zoom = 16): string {
  const lat = latitude.toFixed(6);
  const lon = longitude.toFixed(6);
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=${zoom}/${lat}/${lon}`;
}

/**
 * Lien Waze qui lance la navigation vers le point.
 * `navigate=yes` : Waze calcule tout seul le trajet complet depuis la position actuelle.
 * Ce lien « https » ouvre l'app Waze si elle est installée, sinon la page Waze (installer l'app).
 */
export function wazeNavigationUrl(destination: Coordinates): string {
  return `https://waze.com/ul?ll=${point(destination)}&navigate=yes`;
}

/** Même chose, mais directement avec le « schéma » de l'app Waze (waze://). */
export function wazeAppUrl(destination: Coordinates): string {
  return `waze://?ll=${point(destination)}&navigate=yes`;
}

/**
 * Lien Google Maps « itinéraire » : sans point de départ, Google Maps part de la position actuelle.
 * Il ouvre l'app Google Maps si elle est installée, sinon le site.
 */
export function googleMapsDirectionsUrl(destination: Coordinates): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${point(destination)}`;
}

/** Même chose avec le schéma de l'app Google Maps sur iPhone (comgooglemaps://). */
export function googleMapsAppUrl(destination: Coordinates): string {
  return `comgooglemaps://?daddr=${point(destination)}&directionsmode=driving`;
}

/** Texte envoyé par « Partager » : la position du spot, de quoi lancer le trajet (Google Maps ou Waze) et la carte. */
/** Les libellés du message partagé (traduits par l'écran ; français par défaut). */
export interface ShareTextLabels {
  title: (owner: string) => string;
  species: string;
  googleMaps: string;
  waze: string;
  map: string;
  /** Sépare un libellé de sa valeur : « : » en français, « : » sans espace en anglais et en arabe. */
  separator: string;
}

export const FRENCH_SHARE_LABELS: ShareTextLabels = {
  title: (owner) => `📍 Spot de pêche de ${owner}, partagé avec Spot 🎣`,
  species: 'Espèces',
  googleMaps: 'Itinéraire Google Maps',
  waze: 'Itinéraire Waze',
  map: 'Carte',
  separator: ' : ',
};

export function spotShareText(
  spot: Spot,
  species: readonly CatalogItem[],
  labels: ShareTextLabels = FRENCH_SHARE_LABELS,
  speciesName: (item: CatalogItem) => string = (item) => item.name,
): string {
  const line = (label: string, value: string) => `${label}${labels.separator}${value}`;
  const lines = [labels.title(spot.ownerName)];
  if (species.length > 0) lines.push(line(labels.species, species.map(speciesName).join(', ')));
  lines.push(line('GPS', point(spot.coordinates)));
  lines.push(line(labels.googleMaps, googleMapsDirectionsUrl(spot.coordinates)));
  lines.push(line(labels.waze, wazeNavigationUrl(spot.coordinates)));
  lines.push(line(labels.map, openStreetMapUrl(spot.coordinates)));
  return lines.join('\n');
}
