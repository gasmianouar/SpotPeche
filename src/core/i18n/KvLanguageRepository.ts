import Storage from 'expo-sqlite/kv-store';

import type { LanguageRepository } from './LanguageRepository';
import { isLanguage, type Language } from './languages';

const KEY = 'spot.language';

/** La langue choisie, gardée dans le petit stockage clé-valeur d'expo-sqlite (déjà dans l'app). */
export class KvLanguageRepository implements LanguageRepository {
  async load(): Promise<Language | null> {
    const value = await Storage.getItemAsync(KEY);
    return isLanguage(value) ? value : null;
  }

  async save(language: Language): Promise<void> {
    await Storage.setItemAsync(KEY, language);
  }
}
