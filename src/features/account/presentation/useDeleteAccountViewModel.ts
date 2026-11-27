import { useCallback, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useI18n } from '@/core/i18n/useI18n';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';
import { useSpotDraftStore } from '@/features/spots/presentation/create/spotDraftStore';

import type { PublicContentChoice } from '../domain/ports/AccountDataEraser';
import { DeletionNotConfirmedError } from '../domain/usecases/DeleteAccount';

/** VIEWMODEL de « Supprimer mon compte » (écran 6a de la maquette). */
export function useDeleteAccountViewModel() {
  const { t } = useI18n();
  const { deleteAccount, signOut } = useDependencies();
  const userId = useSessionStore((s) => s.user?.id ?? '');
  const clearSession = useSessionStore((s) => s.clear);

  const [publicContent, setPublicContent] = useState<PublicContentChoice>('delete');
  const [confirmed, setConfirmed] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = useCallback(async () => {
    setError(null);
    setIsDeleting(true);
    try {
      await deleteAccount.execute({ userId, publicContent, confirmed });
      // Le compte n'existe plus : on se déconnecte du fournisseur et on vide la session.
      // Stack.Protected renvoie alors vers l'écran de connexion.
      await signOut.execute().catch(() => undefined);
      useSpotDraftStore.getState().reset();
      clearSession();
    } catch (e) {
      setError(e instanceof DeletionNotConfirmedError ? t('delete.notConfirmed') : t('delete.error'));
      setIsDeleting(false);
    }
  }, [deleteAccount, signOut, clearSession, userId, publicContent, confirmed, t]);

  return {
    publicContent,
    confirmed,
    isDeleting,
    error,
    setPublicContent,
    toggleConfirmed: () => setConfirmed((c) => !c),
    remove,
  };
}
