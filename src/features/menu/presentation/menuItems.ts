import type Ionicons from '@expo/vector-icons/Ionicons';

import type { TranslationKey } from '@/core/i18n/translations';
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
  /** Libellé, traduit à l'affichage. */
  label: TranslationKey;
  /** Petite ligne sous le libellé (facultative). */
  subtitle?: TranslationKey;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor?: string;
  destination: MenuDestination;
}

export const MENU_ITEMS: MenuItem[] = [
  { id: 'map', label: 'menu.map', icon: 'map-outline', destination: { kind: 'map', filter: 'all' } },
  {
    id: 'mySpots',
    label: 'menu.mySpots',
    icon: 'location-outline',
    iconColor: colors.mine,
    destination: { kind: 'map', filter: 'mine' },
  },
  {
    id: 'baitShops',
    label: 'menu.baitShops',
    subtitle: 'menu.baitShopsSubtitle',
    icon: 'storefront-outline',
    destination: { kind: 'nearbyBaitShops' },
  },
  {
    id: 'catches',
    label: 'menu.catches',
    subtitle: 'menu.catchesSubtitle',
    icon: 'fish-outline',
    destination: { kind: 'route', href: '/mes-prises' },
  },
];
