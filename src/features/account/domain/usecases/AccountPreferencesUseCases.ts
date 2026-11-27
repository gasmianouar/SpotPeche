import { isSpotVisibility } from '@/features/spots/domain/entities/Spot';

import {
  DEFAULT_ACCOUNT_PREFERENCES,
  NOTIFICATION_KINDS,
  type AccountPreferences,
  type NotificationPreferences,
} from '../entities/AccountPreferences';
import type { AccountPreferencesRepository } from '../repositories/AccountPreferencesRepository';

/** Complète des réglages partiels ou abîmés avec les valeurs par défaut. */
export function normalizePreferences(value: Partial<AccountPreferences> | null | undefined): AccountPreferences {
  const notifications = { ...DEFAULT_ACCOUNT_PREFERENCES.notifications } as Record<keyof NotificationPreferences, boolean>;
  for (const kind of NOTIFICATION_KINDS) {
    const stored = value?.notifications?.[kind];
    if (typeof stored === 'boolean') notifications[kind] = stored;
  }
  return {
    notifications,
    defaultSpotVisibility: isSpotVisibility(value?.defaultSpotVisibility)
      ? value.defaultSpotVisibility
      : DEFAULT_ACCOUNT_PREFERENCES.defaultSpotVisibility,
  };
}

/** CAS D'USAGE : « lire les réglages du compte » (valeurs par défaut si rien n'est enregistré). */
export class GetAccountPreferences {
  constructor(private readonly repository: AccountPreferencesRepository) {}

  async execute(): Promise<AccountPreferences> {
    return normalizePreferences(await this.repository.load());
  }
}

export interface PreferencesChange {
  notifications?: Partial<NotificationPreferences>;
  defaultSpotVisibility?: AccountPreferences['defaultSpotVisibility'];
}

/** CAS D'USAGE : « changer un réglage » (le reste est conservé). */
export class UpdateAccountPreferences {
  constructor(private readonly repository: AccountPreferencesRepository) {}

  async execute(change: PreferencesChange): Promise<AccountPreferences> {
    const current = normalizePreferences(await this.repository.load());
    const next = normalizePreferences({
      notifications: { ...current.notifications, ...change.notifications },
      defaultSpotVisibility: change.defaultSpotVisibility ?? current.defaultSpotVisibility,
    });
    await this.repository.save(next);
    return next;
  }
}
