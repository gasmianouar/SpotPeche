import type { AccountPreferences } from '../entities/AccountPreferences';

/** Contrat de stockage des réglages du compte. */
export interface AccountPreferencesRepository {
  /** Les réglages enregistrés, ou null s'il n'y en a pas encore. */
  load(): Promise<AccountPreferences | null>;
  save(preferences: AccountPreferences): Promise<void>;
  clear(): Promise<void>;
}
