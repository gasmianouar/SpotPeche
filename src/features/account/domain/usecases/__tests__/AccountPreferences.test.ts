import { InMemoryAccountPreferencesRepository } from '../../../data/InMemoryAccountPreferencesRepository';
import { DEFAULT_ACCOUNT_PREFERENCES } from '../../entities/AccountPreferences';
import { GetAccountPreferences, normalizePreferences, UpdateAccountPreferences } from '../AccountPreferencesUseCases';

describe('Réglages du compte', () => {
  it('donne les valeurs par défaut quand rien n’est enregistré (spots privés)', async () => {
    const prefs = await new GetAccountPreferences(new InMemoryAccountPreferencesRepository()).execute();

    expect(prefs).toEqual(DEFAULT_ACCOUNT_PREFERENCES);
    expect(prefs.defaultSpotVisibility).toBe('private');
  });

  it('change un réglage sans toucher aux autres', async () => {
    const repository = new InMemoryAccountPreferencesRepository();
    const update = new UpdateAccountPreferences(repository);

    await update.execute({ notifications: { goodConditions: true } });
    const prefs = await update.execute({ defaultSpotVisibility: 'public' });

    expect(prefs).toEqual({
      notifications: { replies: true, mySpotsActivity: true, goodConditions: true, nearbySpots: false },
      defaultSpotVisibility: 'public',
    });
    expect(repository.stored).toEqual(prefs);
  });

  it('corrige des réglages enregistrés incomplets ou abîmés', () => {
    const prefs = normalizePreferences({
      notifications: { replies: 'oui' } as never,
      defaultSpotVisibility: 'amis' as never,
    });

    expect(prefs).toEqual(DEFAULT_ACCOUNT_PREFERENCES);
  });
});
