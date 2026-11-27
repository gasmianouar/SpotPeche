import { useEffect, useState, type ReactNode } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import { useSessionStore } from './sessionStore';

/**
 * Au démarrage, reprend la session gardée sur le téléphone avant d'afficher l'app :
 * on évite de montrer l'écran de connexion une fraction de seconde à quelqu'un de déjà connecté.
 */
export function SessionGate({ children }: { children: ReactNode }) {
  const { restoreSession } = useDependencies();
  const setUser = useSessionStore((s) => s.setUser);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    restoreSession.execute().then((user) => {
      if (!active) return;
      if (user) setUser(user);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, [restoreSession, setUser]);

  // L'écran de démarrage reste affiché pendant ce court instant.
  return ready ? <>{children}</> : null;
}
