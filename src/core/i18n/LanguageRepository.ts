import type { Language } from './languages';

/** Contrat : où l'on garde la langue choisie par l'utilisateur. */
export interface LanguageRepository {
  load(): Promise<Language | null>;
  save(language: Language): Promise<void>;
}
