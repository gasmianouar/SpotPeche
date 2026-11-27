import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';

import { useDependencies } from '@/core/di/DependenciesProvider';
import { useI18n } from '@/core/i18n/useI18n';
import type { AuthProvider } from '@/features/auth/domain/entities/User';
import { useSessionStore } from '@/features/auth/presentation/state/sessionStore';
import type { BlockedUser } from '@/features/moderation/domain/entities/Report';
import type { SpotVisibility } from '@/features/spots/domain/entities/Spot';

import { DEFAULT_ACCOUNT_PREFERENCES, type AccountPreferences, type NotificationKind } from '../domain/entities/AccountPreferences';
import type { ProviderLink } from '../domain/usecases/LinkedProviders';

/** VIEWMODEL de « Compte et confidentialité » (écran 6 de la maquette). */
export function useAccountViewModel() {
  const router = useRouter();
  const { t } = useI18n();
  const deps = useDependencies();
  const { getAccountPreferences, updateAccountPreferences, getLinkedProviders, linkProvider, getBlockedUsers, unblockUser } = deps;
  const user = useSessionStore((s) => s.user);
  const userId = user?.id ?? '';

  const [preferences, setPreferences] = useState<AccountPreferences>(DEFAULT_ACCOUNT_PREFERENCES);
  const [providers, setProviders] = useState<ProviderLink[]>([]);
  const [blocked, setBlocked] = useState<BlockedUser[]>([]);
  const [linking, setLinking] = useState<AuthProvider | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Rechargé à chaque retour sur l'écran (un blocage fait depuis une fiche spot y apparaît).
  useFocusEffect(
    useCallback(() => {
      let active = true;
      Promise.all([
        getAccountPreferences.execute(),
        user ? getLinkedProviders.execute(user) : Promise.resolve([]),
        getBlockedUsers.execute(userId),
      ])
        .then(([prefs, links, blockedUsers]) => {
          if (!active) return;
          setPreferences(prefs);
          setProviders(links);
          setBlocked(blockedUsers);
        })
        .catch(() => undefined);
      return () => {
        active = false;
      };
    }, [getAccountPreferences, getLinkedProviders, getBlockedUsers, user, userId]),
  );

  /** Changement affiché tout de suite, puis enregistré ; en cas d'échec on revient en arrière. */
  const save = useCallback(
    async (next: AccountPreferences, change: Parameters<typeof updateAccountPreferences.execute>[0]) => {
      const previous = preferences;
      setPreferences(next);
      setNotice(null);
      try {
        setPreferences(await updateAccountPreferences.execute(change));
      } catch {
        setPreferences(previous);
        setNotice(t('account.saveError'));
      }
    },
    [preferences, updateAccountPreferences, t],
  );

  const toggleNotification = useCallback(
    (kind: NotificationKind, value: boolean) =>
      save({ ...preferences, notifications: { ...preferences.notifications, [kind]: value } }, { notifications: { [kind]: value } }),
    [preferences, save],
  );

  const setDefaultVisibility = useCallback(
    (visibility: SpotVisibility) => save({ ...preferences, defaultSpotVisibility: visibility }, { defaultSpotVisibility: visibility }),
    [preferences, save],
  );

  const link = useCallback(
    async (provider: AuthProvider) => {
      if (!user) return;
      setLinking(provider);
      setNotice(null);
      try {
        await linkProvider.execute(user.id, provider);
        setProviders(await getLinkedProviders.execute(user));
      } catch {
        setNotice(t('account.linkError'));
      } finally {
        setLinking(null);
      }
    },
    [user, linkProvider, getLinkedProviders, t],
  );

  const unblock = useCallback(
    async (blockedId: string) => {
      setBlocked((list) => list.filter((b) => b.blockedId !== blockedId));
      try {
        await unblockUser.execute(userId, blockedId);
      } catch {
        setBlocked(await getBlockedUsers.execute(userId));
        setNotice(t('account.saveError'));
      }
    },
    [unblockUser, getBlockedUsers, userId, t],
  );

  return {
    user,
    preferences,
    providers,
    blocked,
    linking,
    notice,
    toggleNotification,
    setDefaultVisibility,
    link,
    unblock,
    openDelete: () => router.push('/compte/supprimer'),
    back: () => router.back(),
  };
}
