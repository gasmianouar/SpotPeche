import type { AccountPreferences } from '../domain/entities/AccountPreferences';
import type { AccountPreferencesRepository } from '../domain/repositories/AccountPreferencesRepository';

/** Réglages en mémoire (tests). */
export class InMemoryAccountPreferencesRepository implements AccountPreferencesRepository {
  constructor(public stored: AccountPreferences | null = null) {}

  async load(): Promise<AccountPreferences | null> {
    return this.stored;
  }

  async save(preferences: AccountPreferences): Promise<void> {
    this.stored = preferences;
  }

  async clear(): Promise<void> {
    this.stored = null;
  }
}
