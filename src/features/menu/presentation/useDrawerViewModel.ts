import { useGlobalSearchParams, usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useI18n } from '@/core/i18n/useI18n';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import { useDrawerStore } from './drawerStore';
import type { MenuItem } from './menuItems';

/** VIEWMODEL du menu latéral. */
export function useDrawerViewModel() {
  const router = useRouter();
  const pathname = usePathname(); // route affichée, ex. "/" ou "/mes-prises"
  const { filter } = useGlobalSearchParams<{ filter?: string }>(); // ex. "/?filter=mine"
  const { signOut, findNearbyBaitShops } = useDependencies();
  const { isOpen, close } = useDrawerStore();
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clear);
  const { t } = useI18n();

  const isActive = (item: MenuItem) => {
    const d = item.destination;
    if (d.kind === 'map') return pathname === '/' && (filter === 'mine' ? 'mine' : 'all') === d.filter;
    if (d.kind === 'route') return pathname === d.href;
    return false;
  };

  const select = useCallback(
    (item: MenuItem) => {
      close();
      const d = item.destination;
      if (d.kind === 'map') {
        // Même écran (l'accueil), avec un paramètre dans l'URL : /?filter=mine
        router.navigate({ pathname: '/', params: { filter: d.filter } });
      } else if (d.kind === 'route') {
        router.navigate(d.href);
      } else {
        // On quitte Spot pour Google Maps, qui cherche autour de la position du téléphone.
        findNearbyBaitShops.execute().catch(() =>
          Alert.alert(t('menu.baitShops'), t('menu.mapsError')),
        );
      }
    },
    [close, router, findNearbyBaitShops, t],
  );

  /** Petit lien en bas du menu : les mentions des composants open source. */
  const openCredits = useCallback(() => {
    close();
    router.navigate('/a-propos');
  }, [close, router]);

  /** Déconnexion : fermer le menu, prévenir le fournisseur, vider la session. */
  const signOutNow = useCallback(async () => {
    close();
    try {
      await signOut.execute();
    } finally {
      // Même si le fournisseur ne répond pas, on déconnecte localement.
      // Vider la session suffit : Stack.Protected renvoie vers /login.
      clearSession();
    }
  }, [close, signOut, clearSession]);

  const confirmSignOut = useCallback(() => {
    Alert.alert(t('menu.signOutQuestion'), t('menu.signOutHint'), [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('menu.signOut'), style: 'destructive', onPress: signOutNow },
    ]);
  }, [signOutNow, t]);

  return { isOpen, close, user, isActive, select, confirmSignOut, openCredits };
}
