import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import type { CatalogKind } from '../../domain/entities/Catalog';
import type { CatalogPickerVm } from '../picker/CatalogPickerVm';
import { filterCatalog } from '../picker/useCatalogPickerViewModel';
import { useSpotContributionStore } from './spotContributionStore';

/**
 * VIEWMODEL de l'écran de choix depuis la FICHE d'un spot.
 * Ce qui existe déjà est coché et verrouillé : on ne peut qu'ajouter.
 */
export function useSpotItemsPickerViewModel(spotId: string, kind: CatalogKind): CatalogPickerVm {
  const router = useRouter();
  const { getSpotDetail, addSpotItems } = useDependencies();
  const userId = useSessionStore((s) => s.user?.id ?? '');
  const { addedIds, start, toggle, reset } = useSpotContributionStore();

  const [existingIds, setExistingIds] = useState<readonly string[]>([]);
  const [query, setQuery] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    start(spotId, kind);
    let cancelled = false;
    getSpotDetail
      .execute(spotId, userId)
      .then((detail) => {
        if (!cancelled) setExistingIds(kind === 'species' ? detail.spot.speciesIds : detail.spot.baitIds);
      })
      .catch(() => {
        if (!cancelled) setError('Impossible de charger le spot.');
      });
    return () => {
      cancelled = true;
    };
  }, [spotId, kind, userId, getSpotDetail, start]);

  // Une proposition de l'IA déjà présente sur le spot ne compte pas comme un ajout.
  const newIds = useMemo(() => addedIds.filter((id) => !existingIds.includes(id)), [addedIds, existingIds]);

  const items = useMemo(
    () =>
      filterCatalog(kind, query).map((item) => {
        const locked = existingIds.includes(item.id);
        return { ...item, locked, selected: locked || newIds.includes(item.id) };
      }),
    [kind, query, existingIds, newIds],
  );

  const close = useCallback(() => {
    reset();
    router.back();
  }, [reset, router]);

  const confirm = useCallback(async () => {
    if (newIds.length === 0) {
      close();
      return;
    }
    setIsSaving(true);
    setError(null);
    try {
      await addSpotItems.execute(spotId, kind, newIds);
      close();
    } catch {
      setError('L’ajout a échoué. Réessayez.');
    } finally {
      setIsSaving(false);
    }
  }, [newIds, addSpotItems, spotId, kind, close]);

  return {
    items,
    query,
    setQuery,
    countLabel: newIds.length === 0 ? 'Aucun ajout' : `${newIds.length} ajout${newIds.length > 1 ? 's' : ''}`,
    confirmLabel: 'Ajouter',
    isSaving,
    error,
    toggle: (id) => {
      if (!existingIds.includes(id)) toggle(id);
    },
    recognize: () =>
      router.push({
        pathname: '/spot/[id]/reconnaissance',
        params: { id: spotId, type: kind === 'species' ? 'especes' : 'appats' },
      }),
    confirm,
    cancel: close,
  };
}
