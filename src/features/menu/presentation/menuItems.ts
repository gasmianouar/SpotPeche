import type Ionicons from '@expo/vector-icons/Ionicons';

import { colors } from '@/core/theme/tokens';
import type { SpotFilter } from '@/features/spots/domain/usecases/GetMapSpots';

/**
 * La liste des entrées du menu, sous forme de DONNÉES.
 * Ajouter ou retirer une entrée = modifier ce tableau, sans toucher au composant
 * (le O de SOLID : ouvert à l'extension, fermé à la modification).
 */
export type MenuDestination =
  | { kind: 'map'; filter: SpotFilter } // l'accueil, avec tous les spots ou seulement les miens
  | { kind: 'route'; href: '/mes-prises' } // un écran de l'app
  | { kind: 'nearbyBaitShops' }; // ouvre Google Maps : boutiques d'appâts les plus proches

export interface MenuItem {
  id: string;
  label: string;
  /** Petite ligne sous le libellé (facultative). */
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  destination: MenuDestination;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'map', label: 'Carte des spots', icon: 'map-outline', destination: { kind: 'map', filter: 'all' } },
  {
    id: 'mySpots',
    label: 'Mes spots',
    icon: 'location-outline',
    iconColor: colors.mine,
    destination: { kind: 'map', filter: 'mine' },
  },
  {
    id: 'baitShops',
    label: 'Appâts',
    subtitle: 'Boutiques les plus proches · Google Maps',
    icon: 'storefront-outline',
    destination: { kind: 'nearbyBaitShops' },
  },
  {
    id: 'catches',
    label: 'Mes prises',
    subtitle: 'Photos, lieux et dates',
    icon: 'fish-outline',
    destination: { kind: 'route', href: '/mes-prises' },
  },
];
