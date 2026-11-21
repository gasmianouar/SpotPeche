import type Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/core/theme/tokens';

/**
 * La liste des entrées du menu, sous forme de DONNÉES.
 * Ajouter une entrée = ajouter un objet ici, sans toucher au composant
 * (le O de SOLID : ouvert à l'extension, fermé à la modification).
 */
export type MenuDestination =
  | { kind: 'route'; href: '/' | '/meteo' | '/appats' }
  | { kind: 'comingSoon' };

export interface MenuItem {
  id: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  destination: MenuDestination;
}

export const MAIN_MENU: MenuItem[] = [
  { id: 'map', label: 'Carte des spots', icon: 'map-outline', destination: { kind: 'route', href: '/' } },
  { id: 'mySpots', label: 'Mes spots', icon: 'location-outline', iconColor: colors.mine, destination: { kind: 'comingSoon' } },
  { id: 'favorites', label: 'Favoris', icon: 'heart-outline', destination: { kind: 'comingSoon' } },
  { id: 'baitShops', label: 'Appâts', icon: 'storefront-outline', destination: { kind: 'route', href: '/appats' } },
  { id: 'catches', label: 'Carnet de prises', icon: 'fish-outline', destination: { kind: 'comingSoon' } },
  { id: 'weather', label: 'Météo', icon: 'cloud-outline', destination: { kind: 'route', href: '/meteo' } },
];

export const SECONDARY_MENU: MenuItem[] = [
  { id: 'settings', label: 'Paramètres', icon: 'settings-outline', destination: { kind: 'comingSoon' } },
  { id: 'help', label: 'Aide & réglementation', icon: 'help-circle-outline', destination: { kind: 'comingSoon' } },
];
