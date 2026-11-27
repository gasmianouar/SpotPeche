import { FakeAccountRepository } from '../../../data/FakeAccountRepository';
import { GetLinkedProviders, LinkProvider } from '../LinkedProviders';

describe('Comptes de connexion', () => {
  it('liste les 3 fournisseurs : celui de la connexion est associé, les autres non', async () => {
    const links = await new GetLinkedProviders(new FakeAccountRepository(0)).execute({ id: 'me', provider: 'facebook' });

    expect(links).toEqual([
      { provider: 'facebook', linked: true, current: true },
      { provider: 'apple', linked: false, current: false },
      { provider: 'google', linked: false, current: false },
    ]);
  });

  it('associe un autre fournisseur', async () => {
    const repository = new FakeAccountRepository(0);

    await new LinkProvider(repository).execute('me', 'google');
    const links = await new GetLinkedProviders(repository).execute({ id: 'me', provider: 'facebook' });

    expect(links.find((l) => l.provider === 'google')).toEqual({ provider: 'google', linked: true, current: false });
  });
});
