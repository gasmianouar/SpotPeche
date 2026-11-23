import { create } from 'zustand';

import type { CatalogKind } from '../../domain/entities/Catalog';

interface ContributionState {
  spotId: string | null;
  kind: CatalogKind | null;
  /** Ce que la personne coche en plus de ce qui existe déjà sur le spot. */
  addedIds: string[];
  /** Démarre un ajout ; repart de zéro si c'est un autre spot ou un autre catalogue. */
  start: (spotId: string, kind: CatalogKind) => void;
  toggle: (id: string) => void;
  /** Ajoute sans retirer (proposition de l'agent IA). */
  add: (id: string) => void;
  reset: () => void;
}

/**
 * Sélection en cours quand on complète un spot existant.
 * Partagée entre l'écran de choix et l'écran de reconnaissance par photo.
 */
export const useSpotContributionStore = create<ContributionState>((set) => ({
  spotId: null,
  kind: null,
  addedIds: [],
  start: (spotId, kind) =>
    set((state) => (state.spotId === spotId && state.kind === kind ? {} : { spotId, kind, addedIds: [] })),
  toggle: (id) =>
    set((state) => ({
      addedIds: state.addedIds.includes(id) ? state.addedIds.filter((x) => x !== id) : [...state.addedIds, id],
    })),
  add: (id) => set((state) => (state.addedIds.includes(id) ? {} : { addedIds: [...state.addedIds, id] })),
  reset: () => set({ spotId: null, kind: null, addedIds: [] }),
}));
