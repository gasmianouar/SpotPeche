import Storage from 'expo-sqlite/kv-store';

import type { AccountPreferences } from '../domain/entities/AccountPreferences';
import type { AccountPreferencesRepository } from '../domain/repositories/AccountPreferencesRepository';

const KEY = 'spot.accountPreferences';

/** Réglages du compte, gardés en JSON dans le petit stockage clé-valeur d'expo-sqlite (comme la langue). */
export class KvAccountPreferencesRepository implements AccountPreferencesRepository {
  async load(): Promise<AccountPreferences | null> {
    const value = await Storage.getItemAsync(KEY);
    if (!value) return null;
    try {
      // Relu prudemment : GetAccountPreferences complète ou corrige les valeurs manquantes.
      return JSON.parse(value) as AccountPreferences;
    } catch {
      return null;
    }
  }

  async save(preferences: AccountPreferences): Promise<void> {
    await Storage.setItemAsync(KEY, JSON.stringify(preferences));
  }

  async clear(): Promise<void> {
    await Storage.removeItemAsync(KEY);
  }
}
