import { useCallback, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';

import type { AuthProvider } from '../../domain/entities/User';
import { SignInCancelledError } from '../../domain/repositories/AuthRepository';
import { useSessionStore } from '../state/sessionStore';

/** Tout ce que l'écran doit afficher, dans un seul objet (l'« état d'UI »). */
export interface LoginUiState {
  /** Le fournisseur en cours de connexion, ou null si rien ne charge. */
  loadingProvider: AuthProvider | null;
  errorMessage: string | null;
}

/**
 * VIEWMODEL de l'écran de connexion, écrit comme un « custom hook » React.
 *
 * - Il expose un état (uiState) et des actions (signIn).
 * - L'écran ne fait qu'afficher uiState et appeler les actions.
 * - Il ne connaît pas Facebook ni Apple : il appelle le cas d'usage.
 */
export function useLoginViewModel() {
  const { signInWithProvider } = useDependencies();
  const setUser = useSessionStore((state) => state.setUser);

  const [uiState, setUiState] = useState<LoginUiState>({
    loadingProvider: null,
    errorMessage: null,
  });

  const signIn = useCallback(
    async (provider: AuthProvider) => {
      setUiState({ loadingProvider: provider, errorMessage: null });
      try {
        const user = await signInWithProvider.execute(provider);
        // Mettre l'utilisateur dans la session suffit : la navigation
        // (Stack.Protected dans app/_layout.tsx) bascule seule vers l'accueil.
        setUser(user);
      } catch (error) {
        const errorMessage =
          error instanceof SignInCancelledError
            ? null
            : 'La connexion a échoué. Vérifiez votre réseau et réessayez.';
        setUiState({ loadingProvider: null, errorMessage });
      }
    },
    [signInWithProvider, setUser],
  );

  return { uiState, signIn };
}
