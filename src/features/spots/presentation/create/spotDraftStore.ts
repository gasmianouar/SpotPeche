import { create } from 'zustand';

import type { Coordinates } from '@/shared/domain/Coordinates';

import type { CatalogKind } from '../../domain/entities/Catalog';
import type { FishActivity, SpotVisibility } from '../../domain/entities/Spot';
import type { SpotDraft } from '../../domain/usecases/CreateSpot';

/** D'où vient la position : du GPS (exacte) ou de la carte déplacée à la main. */
export type PositionSource = 'gps' | 'map';

interface DraftState extends SpotDraft {
  positionSource: PositionSource | null;
  /** Marge d'erreur du GPS en mètres (null si la position vient de la carte). */
  accuracyMeters: number | null;
  /** Vrai dès que l'utilisateur a choisi lui-même la visibilité (le réglage par défaut ne l'écrase plus). */
  visibilityChosen: boolean;

  setPosition: (coordinates: Coordinates, source: PositionSource, accuracyMeters?: number | null) => void;
  toggleItem: (kind: CatalogKind, id: string) => void;
  /** Ajoute sans retirer (utilisé par la reconnaissance IA). */
  addItem: (kind: CatalogKind, id: string) => void;
  setActivity: (activity: FishActivity) => void;
  /** Choix de l'utilisateur dans le formulaire. */
  setVisibility: (visibility: SpotVisibility) => void;
  /** Valeur par défaut venue des réglages du compte (ignorée si l'utilisateur a déjà choisi). */
  applyDefaultVisibility: (visibility: SpotVisibility) => void;
  setDescription: (description: string) => void;
  addPhotos: (uris: string[]) => void;
  removePhoto: (uri: string) => void;
  reset: () => void;
}

const EMPTY: SpotDraft & Pick<DraftState, 'positionSource' | 'accuracyMeters' | 'visibilityChosen'> = {
  coordinates: null,
  positionSource: null,
  accuracyMeters: null,
  // Privé par défaut : les pêcheurs protègent leurs coins.
  visibility: 'private',
  visibilityChosen: false,
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
  setVisibility: (visibility) => set({ visibility, visibilityChosen: true }),
  applyDefaultVisibility: (visibility) => set((state) => (state.visibilityChosen ? {} : { visibility })),
  setDescription: (description) => set({ description }),
  addPhotos: (uris) => set((state) => ({ photoUris: [...state.photoUris, ...uris].slice(0, MAX_PHOTOS) })),
  removePhoto: (uri) => set((state) => ({ photoUris: state.photoUris.filter((u) => u !== uri) })),
  reset: () => set(EMPTY),
}));

export const MAX_PHOTOS = 6;

/** Lecture pratique de la liste sélectionnée pour un type de catalogue. */
export const selectIds = (kind: CatalogKind) => (state: DraftState) => state[listKey(kind)];
