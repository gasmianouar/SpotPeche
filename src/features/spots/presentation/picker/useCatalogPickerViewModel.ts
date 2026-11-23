import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';

import { catalogFor, type CatalogKind } from '../../domain/entities/Catalog';
import { selectIds, useSpotDraftStore } from '../create/spotDraftStore';
import type { CatalogPickerVm } from './CatalogPickerVm';

/** Retire accents et majuscules : « perche » trouve « Perche », « mais » trouve « Maïs ». */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/** Filtre du catalogue par la recherche (nom français ou latin). */
export function filterCatalog(kind: CatalogKind, query: string) {
  const q = normalize(query.trim());
  return catalogFor(kind).filter(
    (item) => !q || normalize(item.name).includes(q) || normalize(item.latinName ?? '').includes(q),
  );
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

  const items = useMemo(
    () => filterCatalog(kind, query).map((item) => ({ ...item, selected: selectedIds.includes(item.id), locked: false })),
    [kind, query, selectedIds],
  );

  return {
    items,
    query,
    setQuery,
    countLabel: `${selectedIds.length} sélectionné(s)`,
    confirmLabel: 'OK',
    isSaving: false,
    error: null,
    toggle: (id: string) => toggleItem(kind, id),
    recognize: () =>
      router.push({ pathname: '/nouveau-spot/reconnaissance', params: { type: kind === 'species' ? 'especes' : 'appats' } }),
    confirm: () => router.back(),
    cancel: () => router.back(),
  };
}
