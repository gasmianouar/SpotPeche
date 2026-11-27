import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import type { Catch } from '../domain/entities/Catch';
import { CATCH_PERIODS, filterByPeriod, type CatchPeriod } from '../domain/services/catchPeriods';
import { catchCountLabel, formatCatchShortDate } from './catchFormat';

export type MyCatchesUiState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; catches: Catch[] };

/** VIEWMODEL de l'écran « Mes prises ». */
export function useMyCatchesViewModel() {
  const router = useRouter();
  const { getMyCatches } = useDependencies();
  const user = useSessionStore((s) => s.user);
  const [uiState, setUiState] = useState<MyCatchesUiState>({ status: 'loading' });
  const [period, setPeriod] = useState<CatchPeriod>('all');
  const [openedId, setOpenedId] = useState<string | null>(null);
  const requestId = useRef(0);

  const load = useCallback(async () => {
    if (!user) return;
    const id = ++requestId.current;
    try {
      const catches = await getMyCatches.execute(user.id);
      if (id === requestId.current) setUiState({ status: 'ready', catches });
    } catch {
      if (id === requestId.current) setUiState({ status: 'error', message: 'Impossible de charger vos prises. Réessayez.' });
    }
  }, [getMyCatches, user]);

  // Rechargé à chaque retour sur l'écran : une photo publiée entre-temps apparaît.
  useFocusEffect(
    useCallback(() => {
      load();
      const ids = requestId;
      return () => {
        ids.current++;
      };
    }, [load]),
  );

  const all = useMemo(() => (uiState.status === 'ready' ? uiState.catches : []), [uiState]);
  const visible = useMemo(() => filterByPeriod(all, period), [all, period]);
  const opened = useMemo(() => all.find((c) => c.id === openedId) ?? null, [all, openedId]);

  const summary =
    all.length === 0
      ? catchCountLabel(0)
      : `${catchCountLabel(all.length)} · la plus récente le ${formatCatchShortDate(all[0].takenAt)}`;

  return {
    uiState,
    summary,
    periods: CATCH_PERIODS,
    period,
    setPeriod,
    visible,
    opened,
    open: (item: Catch) => setOpenedId(item.id),
    close: () => setOpenedId(null),
    openSpot: (item: Catch) => {
      setOpenedId(null);
      router.push({ pathname: '/spot/[id]', params: { id: item.spotId } });
    },
    retry: () => {
      setUiState({ status: 'loading' });
      load();
    },
    back: () => router.back(),
  };
}
