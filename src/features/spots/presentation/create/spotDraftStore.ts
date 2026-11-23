import { create } from 'zustand';

import type { Coordinates } from '@/shared/domain/Coordinates';

import type { CatalogKind } from '../../domain/entities/Catalog';
import type { FishActivity } from '../../domain/entities/Spot';
import type { SpotDraft } from '../../domain/usecases/CreateSpot';

/** D'où vient la position : du GPS (exacte) ou de la carte déplacée à la main. */
export type PositionSource = 'gps' | 'map';

interface DraftState extends SpotDraft {
  positionSource: PositionSource | null;
  /** Marge d'erreur du GPS en mètres (null si la position vient de la carte). */
  accuracyMeters: number | null;

  setPosition: (coordinates: Coordinates, source: PositionSource, accuracyMeters?: number | null) => void;
  toggleItem: (kind: CatalogKind, id: string) => void;
  /** Ajoute sans retirer (utilisé par la reconnaissance IA). */
  addItem: (kind: CatalogKind, id: string) => void;
  setActivity: (activity: FishActivity) => void;
  setDescription: (description: string) => void;
  addPhotos: (uris: string[]) => void;
  removePhoto: (uri: string) => void;
  reset: () => void;
}

const EMPTY: SpotDraft & Pick<DraftState, 'positionSource' | 'accuracyMeters'> = {
  coordinates: null,
  positionSource: null,
  accuracyMeters: null,
  speciesIds: [],
  baitIds: [],
  activity: null,
  description: '',
  photoUris: [],
};

const listKey = (kind: CatalogKind) => (kind === 'species' ? 'speciesIds' : 'baitIds');

/**
 * BROUILLON du spot en cours de création.
 *
 * Le parcours « Nouveau spot » s'étale sur plusieurs écrans (formulaire, choix des
 * espèces, choix des appâts, reconnaissance IA) : ils partagent ce petit store
 * Zustand. Il est vidé après l'enregistrement ou à l'abandon.
 */
export const useSpotDraftStore = create<DraftState>((set) => ({
  ...EMPTY,
  setPosition: (coordinates, positionSource, accuracyMeters = null) =>
    set({ coordinates, positionSource, accuracyMeters }),
  toggleItem: (kind, id) =>
    set((state) => {
      const key = listKey(kind);
      const list = state[key];
      return { [key]: list.includes(id) ? list.filter((x) => x !== id) : [...list, id] };
    }),
  addItem: (kind, id) =>
    set((state) => {
      const key = listKey(kind);
      return state[key].includes(id) ? {} : { [key]: [...state[key], id] };
    }),
  setActivity: (activity) => set({ activity }),
  setDescription: (description) => set({ description }),
  addPhotos: (uris) => set((state) => ({ photoUris: [...state.photoUris, ...uris].slice(0, MAX_PHOTOS) })),
  removePhoto: (uri) => set((state) => ({ photoUris: state.photoUris.filter((u) => u !== uri) })),
  reset: () => set(EMPTY),
}));

export const MAX_PHOTOS = 6;

/** Lecture pratique de la liste sélectionnée pour un type de catalogue. */
export const selectIds = (kind: CatalogKind) => (state: DraftState) => state[listKey(kind)];
