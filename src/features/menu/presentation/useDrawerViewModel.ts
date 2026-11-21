import { usePathname, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Alert } from 'react-native';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';

import { useDrawerStore } from './drawerStore';
import type { MenuItem } from './menuItems';

/** VIEWMODEL du menu latéral. */
export function useDrawerViewModel() {
  const router = useRouter();
  const pathname = usePathname(); // route affichée, ex. "/meteo"
  const { signOut } = useDependencies();
  const { isOpen, close } = useDrawerStore();
  const user = useSessionStore((s) => s.user);
  const clearSession = useSessionStore((s) => s.clear);

  const isActive = (item: MenuItem) => item.destination.kind === 'route' && item.destination.href === pathname;

  const select = useCallback(
    (item: MenuItem) => {
      close();
      if (item.destination.kind === 'route') {
        router.navigate(item.destination.href);
      } else {
        Alert.alert(item.label, 'Disponible dans un prochain sprint.');
      }
    },
    [close, router],
  );

  const confirmSignOut = useCallback(() => {
    Alert.alert('Se déconnecter ?', 'Vous devrez vous reconnecter pour accéder à vos spots.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Se déconnecter',
        style: 'destructive',
        onPress: async () => {
          close();
          await signOut.execute();
          // Vider la session suffit : Stack.Protected renvoie vers /login.
          clearSession();
        },
      },
    ]);
  }, [close, signOut, clearSession]);

  return { isOpen, close, user, isActive, select, confirmSignOut };
}
