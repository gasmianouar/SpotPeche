import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useI18n } from '@/core/i18n/useI18n';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import type { CatalogKind } from '../../domain/entities/Catalog';
import type { CatalogPickerVm } from '../picker/CatalogPickerVm';
import type { HabitatFilter } from '../picker/CatalogPickerVm';
import { catalogName } from '../catalog/catalogName';
import { filterCatalog } from '../picker/useCatalogPickerViewModel';
import { useSpotContributionStore } from './spotContributionStore';

/**
 * VIEWMODEL de l'écran de choix depuis la FICHE d'un spot.
 * Ce qui existe déjà est coché et verrouillé : on ne peut qu'ajouter.
 */
export function useSpotItemsPickerViewModel(spotId: string, kind: CatalogKind): CatalogPickerVm {
  const { t, language } = useI18n();
  const router = useRouter();
  const { getSpotDetail, addSpotItems } = useDependencies();
  const userId = useSessionStore((s) => s.user?.id ?? '');
  const { addedIds, start, toggle, reset } = useSpotContributionStore();

  const [existingIds, setExistingIds] = useState<readonly string[]>([]);
  const [query, setQuery] = useState('');
  const [habitat, setHabitat] = useState<HabitatFilter>('sea');
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
        if (!cancelled) setError(t('contribute.loadError'));
      });
    return () => {
      cancelled = true;
    };
  }, [spotId, kind, userId, getSpotDetail, start, t]);

  // Une proposition de l'IA déjà présente sur le spot ne compte pas comme un ajout.
  const newIds = useMemo(() => addedIds.filter((id) => !existingIds.includes(id)), [addedIds, existingIds]);

  const items = useMemo(
    () =>
      filterCatalog(kind, query, habitat).map((item) => {
        const locked = existingIds.includes(item.id);
        return { ...item, name: catalogName(item, language), locked, selected: locked || newIds.includes(item.id) };
      }),
    [kind, query, habitat, existingIds, newIds, language],
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
      setError(t('contribute.saveError'));
    } finally {
      setIsSaving(false);
    }
  }, [newIds, addSpotItems, spotId, kind, close, t]);

  return {
    items,
    query,
    setQuery,
    ...(kind === 'species' ? { habitat, setHabitat } : {}),
    countLabel: newIds.length === 0 ? t('contribute.none') : t('contribute.count', { count: newIds.length }),
    confirmLabel: t('common.add'),
    isSaving,
    error,
    toggle: (id) => {
      if (!existingIds.includes(id)) toggle(id);
    },
    recognize:
      kind === 'species' ? () => router.push({ pathname: '/spot/[id]/reconnaissance', params: { id: spotId } }) : undefined,
    confirm,
    cancel: close,
  };
}
