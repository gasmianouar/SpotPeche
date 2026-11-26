import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { catalogFor, type CatalogKind } from '../../domain/entities/Catalog';
import type { HabitatFilter } from './CatalogPickerVm';
import { selectIds, useSpotDraftStore } from '../create/spotDraftStore';
import type { CatalogPickerVm } from './CatalogPickerVm';

/** Retire accents et majuscules : « perche » trouve « Perche », « mais » trouve « Maïs ». */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * Filtre du catalogue : par milieu (espèces seulement) et par la recherche (nom français, latin,
 * ou nom latin d'un membre d'un groupe). Une recherche tapée cherche dans TOUS les milieux :
 * taper « brochet » avec le filtre « Mer » doit quand même le trouver.
 */
export function filterCatalog(kind: CatalogKind, query: string, habitat: HabitatFilter = 'all') {
  const q = normalize(query.trim());
  const names = (item: ReturnType<typeof catalogFor>[number]) => [item.name, item.latinName ?? '', ...(item.members ?? [])];
  return catalogFor(kind).filter((item) => {
    if (q) return names(item).some((n) => normalize(n).includes(q));
    return kind === 'bait' || habitat === 'all' || item.habitat === habitat;
  });
}

/**
 * VIEWMODEL de l'écran de choix pendant la CRÉATION d'un spot
 * (espèces OU appâts : même code, paramétré par `kind`).
 * La sélection est écrite directement dans le brouillon du spot.
 */
export function useCatalogPickerViewModel(kind: CatalogKind): CatalogPickerVm {
  const router = useRouter();
  const selectedIds = useSpotDraftStore(selectIds(kind));
  const toggleItem = useSpotDraftStore((s) => s.toggleItem);
  const [query, setQuery] = useState('');
  const [habitat, setHabitat] = useState<HabitatFilter>('sea');

  const items = useMemo(
    () => filterCatalog(kind, query, habitat).map((item) => ({ ...item, selected: selectedIds.includes(item.id), locked: false })),
    [kind, query, habitat, selectedIds],
  );

  return {
    items,
    query,
    setQuery,
    // Filtre Mer · Eau douce · Tout : espèces seulement.
    ...(kind === 'species' ? { habitat, setHabitat } : {}),
    countLabel: `${selectedIds.length} sélectionné(s)`,
    confirmLabel: 'OK',
    isSaving: false,
    error: null,
    toggle: (id: string) => toggleItem(kind, id),
    // Reconnaissance par photo : espèces seulement.
    recognize: kind === 'species' ? () => router.push('/nouveau-spot/reconnaissance') : undefined,
    confirm: () => router.back(),
    cancel: () => router.back(),
  };
}
