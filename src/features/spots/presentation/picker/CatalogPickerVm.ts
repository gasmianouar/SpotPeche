import type { CatalogItem } from '../../domain/entities/Catalog';

/** Un élément de la grille de choix. */
export interface PickerItem extends CatalogItem {
  readonly selected: boolean;
  /** Déjà présent sur le spot : coché, mais on ne peut pas le retirer. */
  readonly locked: boolean;
}

/**
 * Ce dont la VUE de choix a besoin. Deux ViewModels le fournissent :
 * - la création d'un spot (le brouillon) ;
 * - la fiche d'un spot (ajouts sans rien retirer).
 * La vue ne sait pas lequel elle affiche : c'est le D de SOLID.
 */
export interface CatalogPickerVm {
  readonly items: readonly PickerItem[];
  readonly query: string;
  setQuery(query: string): void;
  /** Ex. « 2 sélectionné(s) » ou « 1 ajout ». */
  readonly countLabel: string;
  readonly confirmLabel: string;
  readonly isSaving: boolean;
  readonly error: string | null;
  toggle(id: string): void;
  /** Reconnaître par photo : seulement pour les espèces (absent pour les appâts). */
  readonly recognize?: () => void;
  confirm(): void;
  cancel(): void;
}
