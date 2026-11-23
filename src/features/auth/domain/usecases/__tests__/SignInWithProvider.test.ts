import type { AuthProvider, User } from '../../entities/User';
import type { AuthRepository } from '../../repositories/AuthRepository';
import { SignInWithProvider } from '../SignInWithProvider';

/** Un faux repository écrit pour le test : c'est l'intérêt de l'interface. */
class StubAuthRepository implements AuthRepository {
  constructor(private readonly user: User) {}
  receivedProvider: AuthProvider | null = null;

  async signIn(provider: AuthProvider): Promise<User> {
    this.receivedProvider = provider;
    return this.user;
  }
  async signOut(): Promise<void> {}
}

describe('SignInWithProvider', () => {
  it('connecte avec le fournisseur demandé et renvoie l’utilisateur', async () => {
    const repository = new StubAuthRepository({ id: 'u1', displayName: 'Anouar', photoUrl: null, provider: 'apple' });

    const user = await new SignInWithProvider(repository).execute('apple');

    expect(repository.receivedProvider).toBe('apple');
    expect(user.id).toBe('u1');
  });

  it('refuse un utilisateur sans identifiant', async () => {
    const repository = new StubAuthRepository({ id: '', displayName: 'X', photoUrl: null, provider: 'facebook' });

    await expect(new SignInWithProvider(repository).execute('facebook')).rejects.toThrow('Utilisateur invalide');
  });
});
