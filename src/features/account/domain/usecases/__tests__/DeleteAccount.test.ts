import { InMemoryAccountPreferencesRepository } from '../../../data/InMemoryAccountPreferencesRepository';
import { DEFAULT_ACCOUNT_PREFERENCES } from '../../entities/AccountPreferences';
import type { AccountDataEraser, PublicContentChoice } from '../../ports/AccountDataEraser';
import type { AccountRepository } from '../../repositories/AccountRepository';
import { DeleteAccount, DeletionNotConfirmedError } from '../DeleteAccount';

class SpyAccountRepository implements AccountRepository {
  deleted: string[] = [];
  fail = false;
  async linkedProviders() {
    return [];
  }
  async link() {}
  async deleteAccount(userId: string) {
    if (this.fail) throw new Error('réseau');
    this.deleted.push(userId);
  }
}

class SpyEraser implements AccountDataEraser {
  calls: [string, PublicContentChoice][] = [];
  async erase(userId: string, publicContent: PublicContentChoice) {
    this.calls.push([userId, publicContent]);
  }
}

function setup() {
  const account = new SpyAccountRepository();
  const eraser = new SpyEraser();
  const preferences = new InMemoryAccountPreferencesRepository(DEFAULT_ACCOUNT_PREFERENCES);
  return { account, eraser, preferences, useCase: new DeleteAccount(account, eraser, preferences) };
}

describe('DeleteAccount', () => {
  it('supprime le compte sur le serveur, efface le téléphone et remet les réglages à zéro', async () => {
    const { account, eraser, preferences, useCase } = setup();

    await useCase.execute({ userId: 'me', publicContent: 'anonymize', confirmed: true });

    expect(account.deleted).toEqual(['me']);
    expect(eraser.calls).toEqual([['me', 'anonymize']]);
    expect(preferences.stored).toBeNull();
  });

  it('refuse sans la case « Je comprends » cochée, et ne touche à rien', async () => {
    const { account, eraser, useCase } = setup();

    await expect(useCase.execute({ userId: 'me', publicContent: 'delete', confirmed: false })).rejects.toBeInstanceOf(
      DeletionNotConfirmedError,
    );
    expect(account.deleted).toEqual([]);
    expect(eraser.calls).toEqual([]);
  });

  it('n’efface rien sur le téléphone si le serveur échoue (on peut réessayer)', async () => {
    const { account, eraser, preferences, useCase } = setup();
    account.fail = true;

    await expect(useCase.execute({ userId: 'me', publicContent: 'delete', confirmed: true })).rejects.toThrow('réseau');
    expect(eraser.calls).toEqual([]);
    expect(preferences.stored).toEqual(DEFAULT_ACCOUNT_PREFERENCES);
  });
});
