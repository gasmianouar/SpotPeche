import type { LanguageRepository } from './LanguageRepository';
import { deviceLanguage, type Language } from './languages';

/**
 * La langue de l'app : celle que l'utilisateur a choisie,
 * sinon celle du téléphone (si elle est prise en charge), sinon le français.
 */
export class LanguagePreference {
  constructor(
    private readonly repository: LanguageRepository,
    private readonly device: () => Language = deviceLanguage,
  ) {}

  async current(): Promise<Language> {
    try {
      return (await this.repository.load()) ?? this.device();
    } catch {
      return this.device();
    }
  }

  choose(language: Language): Promise<void> {
    return this.repository.save(language);
  }
}
