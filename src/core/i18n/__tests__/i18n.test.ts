import { LanguagePreference } from '../LanguagePreference';
import type { LanguageRepository } from '../LanguageRepository';
import { languageFromLocale, type Language } from '../languages';
import { translate, TRANSLATIONS } from '../translations';

const memory = (stored: Language | null = null): LanguageRepository & { saved: Language | null } => {
  const repo = {
    saved: stored,
    async load() {
      return repo.saved;
    },
    async save(language: Language) {
      repo.saved = language;
    },
  };
  return repo;
};

describe('langues', () => {
  it('reconnaît la langue du téléphone, sinon le français', () => {
    expect(['ar-MA', 'en_US', 'fr-FR', 'de-DE', ''].map(languageFromLocale)).toEqual(['ar', 'en', 'fr', 'fr', 'fr']);
  });

  it('chaque langue a exactement les mêmes textes que le français', () => {
    const keys = Object.keys(TRANSLATIONS.fr).sort();
    for (const language of ['ar', 'en'] as const) {
      expect(Object.keys(TRANSLATIONS[language]).sort()).toEqual(keys);
      expect(Object.values(TRANSLATIONS[language]).every((text) => text.trim().length > 0)).toBe(true);
    }
    expect(translate('en', 'login.continueFacebook')).toBe('Continue with Facebook');
  });

  it('langue choisie > langue du téléphone', async () => {
    const repo = memory();
    const preference = new LanguagePreference(repo, () => 'en');
    expect(await preference.current()).toBe('en');
    await preference.choose('ar');
    expect(await preference.current()).toBe('ar');
  });
});
